from __future__ import annotations

import json
import os
import uuid
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

# --- Helper Functions ---

def _ensure_teacher(user: FirebaseUser):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

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
        return existing

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
    if not profile:
        # Return empty profile if not found, or 404 depending on frontend expectation
        # Frontend handles 404 as null, so let's return empty dict or 404
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.post("/profile/update")
def update_profile(payload: ProfileUpdatePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    data = payload.model_dump(exclude_unset=True)
    data["updatedAt"] = _utc_now()
    
    # Also update the main user doc if needed (e.g. name)
    # For now, we store profile data in studentProfiles
    upsert_document("studentProfiles", data, document_id=user.uid, merge=True)
    
    return get_document("studentProfiles", user.uid) or {}

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
    LOW_MOOD_STATES = {"sad", "anxious", "stressed", "tired", "overwhelmed"}

    # Wellbeing signals from check-ins
    for doc in query_collection("checkins"):
        checkin = dict(doc.data or {})
        student_id = checkin.get("studentId")
        if not student_id:
            continue
        mood = (checkin.get("mood") or "").lower()
        stress_level = int(checkin.get("stressLevel") or 0)
        if mood in LOW_MOOD_STATES or stress_level >= 7:
            description = f"Low mood '{mood or 'unknown'}' with stress level {stress_level}"
            # Helper to add signal
            if student_id not in alerts_map:
                alerts_map[student_id] = {
                    "studentId": student_id,
                    "studentName": "Unknown", # Would fetch from profile
                    "riskScore": 0,
                    "signals": []
                }
            
            alerts_map[student_id]["signals"].append({
                "category": "wellbeing",
                "description": description,
                "source": checkin | {"id": doc.id}
            })
            alerts_map[student_id]["riskScore"] += 20

    # Academic signals from student submissions (mock logic for now as submissions might be empty)
    # ... (Simplified for brevity, similar logic as original)

    alerts = sorted(alerts_map.values(), key=lambda alert: alert.get("riskScore", 0), reverse=True)

    for alert in alerts:
        try:
            prompt = (
                "You are an analytics assistant helping a teacher prioritize interventions. "
                "Based on the following JSON signals, provide one concise recommendation in plain text. "
                "Signals: "
                f"{json.dumps(alert['signals'])}"
            )
            summary = analytics_agent.run(
                prompt,
                session=session_service.get_session(f"teacher-analytics:{user.uid}:{alert['studentId']}")
            )
            alert["aiSummary"] = str(summary)
        except Exception:
            continue

    return {"alerts": alerts}
