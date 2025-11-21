from __future__ import annotations

import json
import os
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents import get_student_hub_agent, analytics_agent
from auth import verify_firebase_token, FirebaseUser
from db_direct import (
    add_document,
    delete_document,
    get_document,
    query_collection,
    update_document,
    upsert_document,
    _utc_now
)
from memory import session_service

app = FastAPI(title="Student Mentor Backend", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class CreateUserDocRequest(BaseModel):
    uid: str
    email: str

class ProfileUpdatePayload(BaseModel):
    name: Optional[str] = None
    grade: Optional[str] = None
    studentId: Optional[str] = None
    dateOfBirth: Optional[str] = None
    phoneNumber: Optional[str] = None
    interests: Optional[List[str]] = None
    onboardingComplete: Optional[bool] = None

class CheckInPayload(BaseModel):
    mood: str
    stressLevel: int
    sleepHours: float
    notes: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

class CreateAssignmentPayload(BaseModel):
    title: str
    classId: str
    subject: Optional[str] = None
    type: Optional[str] = "homework"  # 'test' or 'homework'
    dueDate: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    attachments: Optional[List[str]] = None
    studentIds: Optional[List[str]] = None
    priority: Optional[str] = "medium"
    estimatedTime: Optional[int] = None

class AttendanceRecordPayload(BaseModel):
    studentId: str
    status: str  # 'present', 'absent', 'late'
    notes: Optional[str] = None

class AttendancePayload(BaseModel):
    classId: str
    date: str
    records: List[AttendanceRecordPayload]
    notes: Optional[str] = None

class TimetableEntryPayload(BaseModel):
    day: str
    startTime: str
    endTime: str
    subject: str
    location: Optional[str] = None

class TimetablePayload(BaseModel):
    classId: str
    week_of: str = Field(..., alias="weekOf")
    entries: List[TimetableEntryPayload]

class CommunityPostPayload(BaseModel):
    content: str
    subject: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    parentId: Optional[str] = None

class ResourceUploadPayload(BaseModel):
    title: str
    subject: str
    topic: str
    url: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    grade: Optional[str] = None

# --- Helper Functions ---

def _ensure_teacher(user: FirebaseUser):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

def _get_student_display_name(student_id: str) -> str:
    profile = get_document("studentProfiles", student_id)
    if profile and profile.data.get("name"):
        return profile.data["name"]
    user_doc = get_document("users", student_id)
    if user_doc and user_doc.data.get("email"):
        return user_doc.data["email"]
    return "Student"

def _parse_iso(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        return None

def _serialize_post(doc_id: str, data: Dict[str, Any], current_user_id: str) -> Dict[str, Any]:
    upvoters = data.get("upvoters", [])
    post = {
        "id": doc_id,
        "authorId": data.get("authorId"),
        "authorName": data.get("authorName"),
        "subject": data.get("subject"),
        "content": data.get("content"),
        "tags": data.get("tags", []),
        "upvoteCount": int(data.get("upvoteCount") or 0),
        "replyCount": int(data.get("replyCount") or 0),
        "createdAt": data.get("createdAt"),
        "hasUpvoted": current_user_id in (upvoters or []),
    }
    if data.get("parentId"):
        post["parentId"] = data["parentId"]
    return post

def _ensure_alert_entry(alerts_map: Dict[str, Dict[str, Any]], student_id: str) -> Dict[str, Any]:
    if student_id not in alerts_map:
        alerts_map[student_id] = {
            "studentId": student_id,
            "studentName": _get_student_display_name(student_id),
            "riskScore": 0,
            "signals": [],
        }
    return alerts_map[student_id]

# --- Endpoints ---

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.post("/auth/create-user-doc")
def create_user_doc(request: CreateUserDocRequest) -> Dict[str, Any]:
    # This endpoint might be called by a post-signup trigger or client
    # We'll default to 'student' role if not specified, but here we just create the base doc
    # In a real app, you'd want strict checks on who can call this
    
    # Check if user already exists
    existing = get_document("users", request.uid)
    if existing:
        return existing.data

    user_data = {
        "uid": request.uid,
        "email": request.email,
        "role": "student",  # Default role
        "createdAt": _utc_now(),
        "updatedAt": _utc_now(),
    }
    upsert_document("users", user_data, document_id=request.uid)
    return user_data

@app.get("/profile")
def get_profile(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    profile = get_document("studentProfiles", user.uid)
    if not profile or not profile.exists:
        # Return default/empty profile structure if not found
        return {"onboardingComplete": False}
    return profile.data

@app.post("/profile/update")
def update_profile(payload: ProfileUpdatePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    data = payload.model_dump(exclude_unset=True)
    data["updatedAt"] = _utc_now()
    
    # Also update the main user doc if needed (e.g. name)
    # For now, we store profile data in studentProfiles
    upsert_document("studentProfiles", data, document_id=user.uid, merge=True)
    
    updated = get_document("studentProfiles", user.uid)
    return updated.data if updated else {}

@app.post("/checkin")
def daily_checkin(payload: CheckInPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    checkin_id = f"{user.uid}_{_utc_now().split('T')[0]}"
    data = payload.model_dump()
    data.update({
        "studentId": user.uid,
        "timestamp": _utc_now(),
    })
    upsert_document("checkins", data, document_id=checkin_id)
    return data

@app.post("/onboarding/chat")
async def chat_endpoint(request: ChatRequest, user: FirebaseUser = Depends(verify_firebase_token)):
    # Use the student hub agent for chat
    agent = get_student_hub_agent()
    session_id = f"chat:{user.uid}"
    session = session_service.get_session(session_id)
    
    # We'll stream the response
    async def response_generator():
        try:
            # The ADK agent.run() might be synchronous or async depending on implementation
            # Assuming synchronous for now based on agents.py, but wrapping in generator
            response = agent.run(request.message, session=session)
            # If response is a string, yield it. If it's an object, convert to string.
            yield f"data: {str(response)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")

@app.get("/peers")
def get_peers(search: Optional[str] = None, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # Query users collection
    # In a real app, we'd use a proper search index (e.g. Algolia or Firestore specific search)
    # Here we'll do a basic query. Firestore doesn't support substring search natively easily.
    # We'll fetch students and filter in memory for this prototype if search is provided.
    
    # Get all students (limit to 50 for safety)
    # Note: In production, this needs a better query strategy
    all_students = query_collection("users", filters=[("role", "==", "student")])
    
    peers = []
    for doc in all_students:
        data = doc.data or {}
        if data.get("uid") == user.uid:
            continue
            
        # Get profile for name
        profile = get_document("studentProfiles", data.get("uid")) or {}
        name = profile.get("name", data.get("email", "Unknown"))
        
        if search and search.lower() not in name.lower():
            continue
            
        peers.append({
            "id": data.get("uid"),
            "name": name,
            "role": "student",
            "isOnline": False, # Placeholder
            "lastSeen": _utc_now() # Placeholder
        })
        
    return {"peers": peers}

@app.get("/peer/messages/{peer_id}")
def get_peer_messages(peer_id: str, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # Construct conversation ID
    conversation_id = "-".join(sorted([user.uid, peer_id]))
    
    messages = query_collection("peerMessages", filters=[("conversationId", "==", conversation_id)])
    formatted_messages = []
    for msg in messages:
        data = msg.data or {}
        formatted_messages.append({
            "id": msg.id,
            **data
        })
        
    return {"messages": formatted_messages}

class SendMessagePayload(BaseModel):
    recipientId: str
    content: str

@app.post("/peer/message")
def send_peer_message(payload: SendMessagePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    conversation_id = "-".join(sorted([user.uid, payload.recipientId]))
    message_id = uuid.uuid4().hex
    
    # Get sender name
    profile = get_document("studentProfiles", user.uid) or {}
    sender_name = profile.get("name", "Unknown")
    
    message_data = {
        "id": message_id,
        "conversationId": conversation_id,
        "senderId": user.uid,
        "senderName": sender_name,
        "receiverId": payload.recipientId,
        "message": payload.content,
        "timestamp": _utc_now(),
        "read": False,
        "type": "text"
    }
    
    add_document("peerMessages", message_data, document_id=message_id)
    return {"message": message_data}

@app.get("/community/feed")
def get_community_feed(
    subject: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 20,
    user: FirebaseUser = Depends(verify_firebase_token),
) -> Dict[str, Any]:
    filters = []
    if subject:
        filters.append(("subject", "==", subject))
    docs = query_collection("communityPosts", filters=filters)

    top_level: List[Dict[str, Any]] = []
    replies: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    query_lower = (q or "").lower()

    for doc in docs:
        data = doc.data or {}
        post = _serialize_post(doc.id, data, user.uid)

        if query_lower:
            haystack = " ".join(
                [
                    post.get("content") or "",
                    post.get("subject") or "",
                    " ".join(post.get("tags") or []),
                ]
            ).lower()
            if query_lower not in haystack:
                continue

        parent_id = data.get("parentId")
        if parent_id:
            replies[parent_id].append(post)
        else:
            top_level.append(post)

    sorted_posts = sorted(
        top_level,
        key=lambda item: item.get("createdAt") or "",
        reverse=True,
    )
    max_posts = max(1, min(limit, 50))
    response_posts = []
    for post in sorted_posts[:max_posts]:
        child_replies = sorted(
            replies.get(post["id"], []),
            key=lambda item: item.get("createdAt") or "",
            reverse=True,
        )
        post["replies"] = child_replies[:5]
        response_posts.append(post)

    return {"posts": response_posts}

@app.post("/community/post")
def create_community_post(payload: CommunityPostPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    post_id = uuid.uuid4().hex
    author_name = _get_student_display_name(user.uid)
    data = {
        "authorId": user.uid,
        "authorName": author_name,
        "subject": payload.subject,
        "content": payload.content,
        "tags": payload.tags,
        "parentId": payload.parentId,
        "upvoteCount": 0,
        "replyCount": 0,
        "createdAt": _utc_now(),
        "upvoters": [],
    }
    add_document("communityPosts", data, document_id=post_id)

    if payload.parentId:
        parent_doc = get_document("communityPosts", payload.parentId)
        if parent_doc:
            current = int(parent_doc.data.get("replyCount") or 0) + 1
            update_document("communityPosts", payload.parentId, {"replyCount": current})

    return _serialize_post(post_id, data, user.uid)

@app.post("/community/post/{post_id}/upvote")
def toggle_upvote(post_id: str, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    document = get_document("communityPosts", post_id)
    if not document:
        raise HTTPException(status_code=404, detail="Post not found")

    data = dict(document.data or {})
    upvoters = data.get("upvoters", [])
    if user.uid in upvoters:
        upvoters.remove(user.uid)
        data["upvoteCount"] = max(0, int(data.get("upvoteCount") or 1) - 1)
    else:
        upvoters.append(user.uid)
        data["upvoteCount"] = int(data.get("upvoteCount") or 0) + 1

    data["upvoters"] = upvoters
    update_document(
        "communityPosts",
        post_id,
        {
            "upvoters": upvoters,
            "upvoteCount": data["upvoteCount"],
        },
    )
    return _serialize_post(post_id, data, user.uid)

@app.get("/resources")
def list_resources(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 40,
    user: FirebaseUser = Depends(verify_firebase_token),
) -> Dict[str, Any]:
    filters = []
    if subject:
        filters.append(("subject", "==", subject))
    if topic:
        filters.append(("topic", "==", topic))

    docs = query_collection("resources", filters=filters)
    query_lower = (q or "").lower()
    rows = []
    for doc in docs:
        data = doc.data or {}
        record = {
            "id": doc.id,
            "title": data.get("title"),
            "subject": data.get("subject"),
            "topic": data.get("topic"),
            "url": data.get("url"),
            "description": data.get("description"),
            "tags": data.get("tags", []),
            "grade": data.get("grade"),
            "createdBy": data.get("createdBy"),
            "createdByName": data.get("createdByName"),
            "createdAt": data.get("createdAt"),
        }
        if query_lower:
            haystack = " ".join(
                [
                    record.get("title") or "",
                    record.get("subject") or "",
                    record.get("topic") or "",
                    record.get("description") or "",
                ]
            ).lower()
            if query_lower not in haystack:
                continue
        rows.append(record)

    rows = sorted(rows, key=lambda item: item.get("createdAt") or "", reverse=True)
    max_rows = max(1, min(limit, 60))
    return {"resources": rows[:max_rows]}

@app.post("/resources")
def upload_resource(payload: ResourceUploadPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    resource_id = uuid.uuid4().hex
    author_name = _get_student_display_name(user.uid)
    data = {
        "title": payload.title,
        "subject": payload.subject,
        "topic": payload.topic,
        "url": payload.url,
        "description": payload.description,
        "tags": payload.tags,
        "grade": payload.grade,
        "createdBy": user.uid,
        "createdByName": author_name,
        "createdAt": _utc_now(),
    }
    add_document("resources", data, document_id=resource_id)
    return {
        "id": resource_id,
        **data,
    }

@app.post("/assignment")
def create_assignment(payload: CreateAssignmentPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)
    
    assignment_id = uuid.uuid4().hex
    data = payload.model_dump()
    data.update({
        "id": assignment_id,
        "teacherId": user.uid,
        "createdAt": _utc_now(),
        "status": "active"
    })
    
    add_document("assignments", data, document_id=assignment_id)
    return data

@app.delete("/assignment/{assignment_id}")
def delete_assignment_endpoint(assignment_id: str, user: FirebaseUser = Depends(verify_firebase_token)):
    _ensure_teacher(user)
    delete_document("assignments", assignment_id)
    return {"status": "deleted", "id": assignment_id}

@app.get("/tests")
def get_tests(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # If teacher, return all tests they created
    # If student, return tests assigned to them (or all for now)
    
    filters = [("type", "==", "test")]
    if user.role == "teacher":
        filters.append(("teacherId", "==", user.uid))
        
    docs = query_collection("assignments", filters=filters)
    tests = []
    for doc in docs:
        data = doc.data or {}
        tests.append({
            "id": doc.id,
            **data
        })
    return {"tests": tests}

@app.get("/homework")
def get_homework(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    filters = [("type", "==", "homework")]
    # For students, we might want to filter by classId or studentIds if implemented
    
    docs = query_collection("assignments", filters=filters)
    homework = []
    for doc in docs:
        data = doc.data or {}
        homework.append({
            "id": doc.id,
            **data
        })
    return {"homework": homework}

@app.post("/attendance")
async def record_attendance(payload: AttendancePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    doc_id = uuid.uuid4().hex
    records = [rec.model_dump(by_alias=True) for rec in payload.records]
    record = {
        "id": doc_id,
        "teacherId": user.uid,
        "classId": payload.class_id,
        "date": payload.date,
        "records": records,
        "notes": payload.notes,
        "createdAt": _utc_now(),
    }
    add_document("attendance", record, document_id=doc_id)
    return record


@app.post("/timetable")
async def upsert_timetable(payload: TimetablePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    doc_id = f"{payload.class_id}-{payload.week_of}"
    record = {
        "id": doc_id,
        "teacherId": user.uid,
        "classId": payload.class_id,
        "weekOf": payload.week_of,
        "entries": [entry.model_dump(by_alias=True) for entry in payload.entries],
        "updatedAt": _utc_now(),
    }
    upsert_document("timetables", record, document_id=doc_id, merge=True)
    return record


@app.get("/analytics/alerts")
async def analytics_alerts(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    alerts_map: Dict[str, Dict[str, Any]] = {}
    history_map: Dict[str, Dict[str, Any]] = defaultdict(dict)
    LOW_MOOD_STATES = {"sad", "anxious", "stressed", "tired", "overwhelmed"}

    checkins_by_student: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for doc in query_collection("checkins"):
        checkin = dict(doc.data or {})
        student_id = checkin.get("studentId")
        if not student_id:
            continue
        checkin["id"] = doc.id
        checkins_by_student[student_id].append(checkin)
        mood = (checkin.get("mood") or "").lower()
        stress_level = int(checkin.get("stressLevel") or 0)
        if mood in LOW_MOOD_STATES or stress_level >= 7:
            entry = _ensure_alert_entry(alerts_map, student_id)
            entry["signals"].append({
                "category": "wellbeing",
                "description": f"Low mood '{mood or 'unknown'}' with stress level {stress_level}",
                "source": checkin,
            })
            entry["riskScore"] += 20

    for student_id, records in checkins_by_student.items():
        sorted_records = sorted(records, key=lambda item: item.get("timestamp") or "", reverse=True)
        history_map[student_id]["recentCheckins"] = sorted_records[:7]
        streak = 0
        for record in sorted_records:
            if (record.get("mood") or "").lower() in LOW_MOOD_STATES:
                streak += 1
            else:
                break
        if streak >= 5:
            entry = _ensure_alert_entry(alerts_map, student_id)
            entry["signals"].append({
                "category": "pattern",
                "description": f"Low mood reported for {streak} consecutive check-ins.",
                "source": {"recentCheckins": sorted_records[:streak]},
            })
            entry["riskScore"] += 25

    assignments_index = {
        doc.id: doc.data or {}
        for doc in query_collection("assignments")
    }
    submissions_by_student: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for submission_doc in query_collection("studentSubmissions"):
        data = dict(submission_doc.data or {})
        student_id = data.get("studentId")
        if not student_id:
            continue
        data["id"] = submission_doc.id
        submissions_by_student[student_id].append(data)

    now = datetime.now(timezone.utc)
    for student_id, submissions in submissions_by_student.items():
        missed: List[Dict[str, Any]] = []
        for submission in submissions:
            assignment_id = submission.get("assignmentId")
            assignment = assignments_index.get(assignment_id or "")
            if not assignment:
                continue
            due = _parse_iso(assignment.get("dueDate"))
            if due and due < now:
                status = (submission.get("status") or "pending").lower()
                if status not in {"submitted", "completed"}:
                    missed.append({
                        "assignmentId": assignment_id,
                        "title": assignment.get("title"),
                        "dueDate": assignment.get("dueDate"),
                        "status": status,
                    })
        if len(missed) >= 3:
            entry = _ensure_alert_entry(alerts_map, student_id)
            entry["signals"].append({
                "category": "academic",
                "description": f"{len(missed)} past-due assignments without submissions.",
                "source": {"missedAssignments": missed[:5]},
            })
            entry["riskScore"] += 20
            history_map[student_id]["missedAssignments"] = missed[:5]

    if not alerts_map:
        recent_checkins = query_collection("checkins", limit=5)
        seen_students = set()
        for doc in recent_checkins:
            data = doc.data or {}
            sid = data.get("studentId")
            if sid and sid not in seen_students:
                seen_students.add(sid)
                entry = _ensure_alert_entry(alerts_map, sid)
                entry["signals"].append({
                    "category": "positive",
                    "description": "Consistent check-ins and stable mood reported.",
                    "source": data,
                })

    alerts = sorted(alerts_map.values(), key=lambda alert: alert.get("riskScore", 0), reverse=True)

    for alert in alerts:
        alert["history"] = history_map.get(alert["studentId"], {})
        try:
            prompt = (
                "You are an analytics assistant monitoring longitudinal student data. "
                "Summarize risks or positive trends in one sentence. "
                "Highlight repeated missed assignments or multi-day mood drops when present. "
                f"Signals: {json.dumps(alert['signals'])}\n"
                f"Historical context: {json.dumps(alert.get('history', {}))}"
            )
            summary = analytics_agent.run(
                prompt,
                session=session_service.get_session(f"teacher-analytics:{user.uid}:{alert['studentId']}"),
            )
            alert["aiSummary"] = str(summary)
        except Exception:
            alert["aiSummary"] = "Unable to generate summary."

    return {"alerts": alerts}
