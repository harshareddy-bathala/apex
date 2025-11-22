from __future__ import annotations

import json
import os
import uuid
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Literal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents import get_student_hub_agent, analytics_agent
from auth import verify_firebase_token, FirebaseUser
from database import init_database
from memory import session_service
from models import (
    User, Habit, CommunityPost, Resource, Assignment,
    CheckIn, Attendance, Timetable, PeerMessage, StudentSubmission
)

app = FastAPI(title="Student Mentor Backend", version="2.0.0")

# Database startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database connection and Beanie ODM"""
    database = await init_database()
    from beanie import init_beanie
    await init_beanie(
        database=database,
        document_models=[
            User, Habit, CommunityPost, Resource, Assignment,
            CheckIn, Attendance, Timetable, PeerMessage, StudentSubmission
        ]
    )

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
    bio: Optional[str] = None
    hobbies: Optional[List[str]] = None
    followers: Optional[int] = None
    notesShared: Optional[int] = None
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
    topic: Optional[str] = None
    chapter: Optional[str] = None
    url: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    grade: Optional[str] = None

class HabitPayload(BaseModel):
    name: str
    timeOfDay: Literal["morning", "afternoon", "evening"] = "morning"

class HabitCheckinPayload(BaseModel):
    habitId: str
    completed: bool = True
    date: Optional[str] = None

# --- Helper Functions ---
DEFAULT_HABITS = [
    {"name": "Drink Water", "timeOfDay": "morning"},
    {"name": "Read 10 pages", "timeOfDay": "evening"},
    {"name": "Meditate", "timeOfDay": "evening"},
]

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
        "authorRole": data.get("authorRole", "student"),
        "subject": data.get("subject"),
        "content": data.get("content"),
        "tags": data.get("tags", []),
        "upvoteCount": int(data.get("upvoteCount") or 0),
        "replyCount": int(data.get("replyCount") or 0),
        "createdAt": data.get("createdAt"),
        "hasUpvoted": current_user_id in (upvoters or []),
    }
    post["isTeacher"] = post["authorRole"] == "teacher"
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

async def _ensure_default_habits(student_id: str):
    existing = await Habit.find_one(Habit.user_email == student_id)
    if existing:
        return
    for habit_data in DEFAULT_HABITS:
        habit = Habit(
            user_email=student_id,
            title=habit_data["name"],
            timeOfDay=habit_data["timeOfDay"],
            archived=False,
        )
        await habit.insert()

# --- Endpoints ---

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.post("/auth/create-user-doc")
async def create_user_doc(request: CreateUserDocRequest) -> Dict[str, Any]:
    # This endpoint might be called by a post-signup trigger or client
    # We'll default to 'student' role if not specified, but here we just create the base doc
    # In a real app, you'd want strict checks on who can call this

    # Check if user already exists
    existing = await User.find_one(User.id == request.uid)
    if existing:
        return existing.model_dump()

    user = User(
        id=request.uid,
        email=request.email,
        role="student",  # Default role
    )
    await user.insert()
    return user.model_dump()

@app.get("/profile")
async def get_profile(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    user_doc = await User.find_one(User.id == user.uid)
    if not user_doc or not user_doc.profile:
        # Return default/empty profile structure if not found
        return {"onboardingComplete": False}
    return user_doc.profile.model_dump()

@app.post("/profile/update")
async def update_profile(payload: ProfileUpdatePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    user_doc = await User.find_one(User.id == user.uid)
    if not user_doc:
        user_doc = User(id=user.uid, email=user.email)
        await user_doc.insert()

    # Update profile data
    profile_data = payload.model_dump(exclude_unset=True)
    if user_doc.profile:
        # Merge with existing profile
        current_profile = user_doc.profile.model_dump()
        current_profile.update(profile_data)
        user_doc.profile = Profile(**current_profile)
    else:
        user_doc.profile = Profile(**profile_data)

    user_doc.updatedAt = datetime.utcnow()
    await user_doc.save()

    return user_doc.profile.model_dump()

@app.post("/checkin")
async def daily_checkin(payload: CheckInPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    checkin = CheckIn(
        studentId=user.uid,
        mood=payload.mood,
        stressLevel=payload.stressLevel,
        sleepHours=payload.sleepHours,
        notes=payload.notes,
    )
    await checkin.insert()
    return checkin.model_dump()

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
async def get_peers(search: Optional[str] = None, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # Query users collection for students
    query = User.find(User.role == "student", User.id != user.uid)

    if search:
        # Simple text search - in production, use MongoDB Atlas Search
        query = query.find({"$or": [
            {"email": {"$regex": search, "$options": "i"}},
            {"profile.name": {"$regex": search, "$options": "i"}}
        ]})

    all_students = await query.to_list()

    peers = []
    for student in all_students:
        name = student.profile.name if student.profile and student.profile.name else student.email

        if search and search.lower() not in name.lower():
            continue

        peers.append({
            "id": student.id,
            "name": name,
            "role": "student",
            "isOnline": False, # Placeholder
            "lastSeen": datetime.utcnow().isoformat() # Placeholder
        })

    return {"peers": peers}

@app.get("/peer/messages/{peer_id}")
async def get_peer_messages(peer_id: str, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # Construct conversation ID
    conversation_id = "-".join(sorted([user.uid, peer_id]))

    messages = await PeerMessage.find(
        PeerMessage.conversationId == conversation_id
    ).sort([("timestamp", 1)]).to_list()

    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": msg.id,
            "conversationId": msg.conversationId,
            "senderId": msg.senderId,
            "senderName": msg.senderName,
            "receiverId": msg.receiverId,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat(),
            "read": msg.read,
            "type": msg.type
        })

    return {"messages": formatted_messages}

class SendMessagePayload(BaseModel):
    recipientId: str
    content: str

@app.post("/peer/message")
async def send_peer_message(payload: SendMessagePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    conversation_id = "-".join(sorted([user.uid, payload.recipientId]))

    # Get sender name
    user_doc = await User.find_one(User.id == user.uid)
    sender_name = user_doc.profile.name if user_doc and user_doc.profile and user_doc.profile.name else "Unknown"

    message = PeerMessage(
        conversationId=conversation_id,
        senderId=user.uid,
        senderName=sender_name,
        receiverId=payload.recipientId,
        message=payload.content,
        type="text"
    )

    await message.insert()

    return {
        "message": {
            "id": message.id,
            "conversationId": message.conversationId,
            "senderId": message.senderId,
            "senderName": message.senderName,
            "receiverId": message.receiverId,
            "message": message.message,
            "timestamp": message.timestamp.isoformat(),
            "read": message.read,
            "type": message.type
        }
    }

@app.get("/community/feed")
async def get_community_feed(
    subject: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 20,
    user: FirebaseUser = Depends(verify_firebase_token),
) -> Dict[str, Any]:
    # Build query
    query = CommunityPost.find(CommunityPost.parentId == None)  # Only top-level posts

    if subject:
        query = query.find(CommunityPost.subject == subject)

    # Get posts
    posts = await query.sort([("createdAt", -1)]).to_list(limit=min(limit, 50))

    # Filter by search query if provided
    if q:
        query_lower = q.lower()
        filtered_posts = []
        for post in posts:
            haystack = " ".join([
                post.content or "",
                post.subject or "",
                " ".join(post.tags or []),
            ]).lower()
            if query_lower in haystack:
                filtered_posts.append(post)
        posts = filtered_posts

    # Get replies for each post
    response_posts = []
    for post in posts:
        # Get replies for this post
        replies = await CommunityPost.find(
            CommunityPost.parentId == post.id
        ).sort([("createdAt", -1)]).to_list(limit=5)

        serialized_post = {
            "id": post.id,
            "authorId": post.author,
            "authorName": post.authorName,
            "authorRole": post.authorRole,
            "subject": post.subject,
            "content": post.content,
            "tags": post.tags,
            "upvoteCount": post.upvoteCount,
            "replyCount": post.replyCount,
            "createdAt": post.createdAt.isoformat(),
            "hasUpvoted": user.uid in post.upvotes,
            "replies": []
        }

        # Serialize replies
        for reply in replies:
            serialized_reply = {
                "id": reply.id,
                "authorId": reply.author,
                "authorName": reply.authorName,
                "authorRole": reply.authorRole,
                "subject": reply.subject,
                "content": reply.content,
                "tags": reply.tags,
                "upvoteCount": reply.upvoteCount,
                "replyCount": reply.replyCount,
                "createdAt": reply.createdAt.isoformat(),
                "hasUpvoted": user.uid in reply.upvotes,
                "parentId": reply.parentId
            }
            serialized_post["replies"].append(serialized_reply)

        response_posts.append(serialized_post)

    return {"posts": response_posts}

@app.post("/community/post")
async def create_community_post(payload: CommunityPostPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # Get author name
    user_doc = await User.find_one(User.id == user.uid)
    author_name = user_doc.profile.name if user_doc and user_doc.profile and user_doc.profile.name else user.email

    post = CommunityPost(
        author=user.uid,
        authorName=author_name,
        authorRole=user.role,
        subject=payload.subject,
        content=payload.content,
        tags=payload.tags,
        parentId=payload.parentId,
    )

    await post.insert()

    # Update reply count on parent post if this is a reply
    if payload.parentId:
        parent_post = await CommunityPost.find_one(CommunityPost.id == payload.parentId)
        if parent_post:
            parent_post.replyCount += 1
            await parent_post.save()

    return {
        "id": post.id,
        "authorId": post.author,
        "authorName": post.authorName,
        "authorRole": post.authorRole,
        "subject": post.subject,
        "content": post.content,
        "tags": post.tags,
        "upvoteCount": post.upvoteCount,
        "replyCount": post.replyCount,
        "createdAt": post.createdAt.isoformat(),
        "hasUpvoted": False,
    }

@app.post("/community/post/{post_id}/upvote")
async def toggle_upvote(post_id: str, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    post = await CommunityPost.find_one(CommunityPost.id == post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if user.uid in post.upvotes:
        post.upvotes.remove(user.uid)
        post.upvoteCount = max(0, post.upvoteCount - 1)
    else:
        post.upvotes.append(user.uid)
        post.upvoteCount += 1

    await post.save()

    return {
        "id": post.id,
        "authorId": post.author,
        "authorName": post.authorName,
        "authorRole": post.authorRole,
        "subject": post.subject,
        "content": post.content,
        "tags": post.tags,
        "upvoteCount": post.upvoteCount,
        "replyCount": post.replyCount,
        "createdAt": post.createdAt.isoformat(),
        "hasUpvoted": user.uid in post.upvotes,
    }

@app.get("/resources")
async def list_resources(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    chapter: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 40,
    user: FirebaseUser = Depends(verify_firebase_token),
) -> Dict[str, Any]:
    # Build query
    query = Resource.find()

    if subject:
        query = query.find(Resource.subject == subject)
    if chapter:
        query = query.find(Resource.chapter == chapter)
    elif topic:
        query = query.find(Resource.topic == topic)

    # Get resources
    resources = await query.sort([("createdAt", -1)]).to_list(limit=min(limit, 60))

    # Filter by search query if provided
    if q:
        query_lower = q.lower()
        filtered_resources = []
        for resource in resources:
            haystack = " ".join([
                resource.title or "",
                resource.subject or "",
                resource.topic or "",
                resource.description or "",
            ]).lower()
            if query_lower in haystack:
                filtered_resources.append(resource)
        resources = filtered_resources

    # Convert to response format
    rows = []
    for resource in resources:
        record = {
            "id": resource.id,
            "title": resource.title,
            "subject": resource.subject,
            "topic": resource.topic,
            "chapter": resource.chapter,
            "url": resource.url,
            "description": resource.description,
            "tags": resource.tags,
            "grade": resource.grade,
            "createdBy": resource.uploaded_by,
            "createdByName": resource.createdByName,
            "createdAt": resource.createdAt.isoformat(),
        }
        rows.append(record)

    return {"resources": rows}

@app.post("/resources")
async def upload_resource(payload: ResourceUploadPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # Get author name
    user_doc = await User.find_one(User.id == user.uid)
    author_name = user_doc.profile.name if user_doc and user_doc.profile and user_doc.profile.name else user.email

    chapter = payload.chapter or payload.topic or "General"

    resource = Resource(
        title=payload.title,
        subject=payload.subject,
        topic=payload.topic or chapter,
        chapter=chapter,
        url=payload.url,
        description=payload.description,
        tags=payload.tags,
        grade=payload.grade,
        uploaded_by=user.uid,
        createdByName=author_name,
    )

    await resource.insert()

    # Update user's notesShared count
    try:
        if user_doc and user_doc.profile:
            user_doc.profile.notesShared = (user_doc.profile.notesShared or 0) + 1
            user_doc.updatedAt = datetime.utcnow()
            await user_doc.save()
    except Exception:
        # Do not block uploads if stats update fails
        pass

    return {
        "id": resource.id,
        "title": resource.title,
        "subject": resource.subject,
        "topic": resource.topic,
        "chapter": resource.chapter,
        "url": resource.url,
        "description": resource.description,
        "tags": resource.tags,
        "grade": resource.grade,
        "createdBy": resource.uploaded_by,
        "createdByName": resource.createdByName,
        "createdAt": resource.createdAt.isoformat(),
    }

@app.get("/habits")
async def list_habits(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    await _ensure_default_habits(user.uid)
    today = datetime.utcnow().date().isoformat()

    habits = await Habit.find(
        Habit.user_email == user.uid,
        Habit.archived == False
    ).to_list()

    # Check today's completions
    from models import Habit  # Import here to avoid circular import
    completed_habits = await Habit.find(
        Habit.user_email == user.uid,
        Habit.completed_dates == today
    ).to_list()

    completed_ids = {habit.id for habit in completed_habits}

    habit_list: List[Dict[str, Any]] = []
    for habit in habits:
        habit_list.append({
            "id": habit.id,
            "studentId": habit.user_email,
            "name": habit.title,
            "timeOfDay": habit.timeOfDay,
            "createdAt": habit.createdAt.isoformat(),
            "archived": habit.archived,
            "completedToday": habit.id in completed_ids,
            "lastCompletedAt": habit.lastCompletedAt,
        })

    return {"habits": habit_list}

@app.post("/habits")
async def create_habit(payload: HabitPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    habit = Habit(
        user_email=user.uid,
        title=payload.name,
        timeOfDay=payload.timeOfDay,
        archived=False,
    )
    await habit.insert()

    return {
        "id": habit.id,
        "studentId": habit.user_email,
        "name": habit.title,
        "timeOfDay": habit.timeOfDay,
        "createdAt": habit.createdAt.isoformat(),
        "archived": habit.archived,
        "completedToday": False,
        "lastCompletedAt": habit.lastCompletedAt,
    }

@app.post("/habits/checkin")
async def habit_checkin(payload: HabitCheckinPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    habit = await Habit.find_one(Habit.id == payload.habitId, Habit.user_email == user.uid)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    date = payload.date or datetime.utcnow().date().isoformat()

    if payload.completed:
        if date not in habit.completed_dates:
            habit.completed_dates.append(date)
            habit.lastCompletedAt = date
            await habit.save()
    else:
        if date in habit.completed_dates:
            habit.completed_dates.remove(date)
            # Update lastCompletedAt to the most recent remaining date
            if habit.completed_dates:
                habit.lastCompletedAt = max(habit.completed_dates)
            else:
                habit.lastCompletedAt = None
            await habit.save()

    return {"status": "ok", "completed": payload.completed}

@app.post("/assignment")
async def create_assignment(payload: CreateAssignmentPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    assignment = Assignment(
        title=payload.title,
        subject=payload.subject,
        type=payload.type,
        dueDate=payload.dueDate,
        description=payload.description,
        instructions=payload.instructions,
        attachments=payload.attachments,
        studentIds=payload.studentIds,
        priority=payload.priority,
        estimatedTime=payload.estimatedTime,
        teacherId=user.uid,
        classId=payload.classId,
        status="active"
    )

    await assignment.insert()

    # Create student submissions if studentIds provided
    if payload.studentIds:
        for student_id in payload.studentIds:
            submission = StudentSubmission(
                assignmentId=assignment.id,
                studentId=student_id,
                status="pending"
            )
            await submission.insert()

    return assignment.model_dump()

@app.delete("/assignment/{assignment_id}")
async def delete_assignment_endpoint(assignment_id: str, user: FirebaseUser = Depends(verify_firebase_token)):
    _ensure_teacher(user)
    assignment = await Assignment.find_one(Assignment.id == assignment_id, Assignment.teacherId == user.uid)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Delete associated submissions
    await StudentSubmission.find(StudentSubmission.assignmentId == assignment_id).delete()

    # Delete the assignment
    await assignment.delete()

    return {"status": "deleted", "id": assignment_id}

@app.get("/tests")
async def get_tests(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    # If teacher, return all tests they created
    # If student, return tests assigned to them (or all for now)

    query = Assignment.find(Assignment.type == "test")

    if user.role == "teacher":
        query = query.find(Assignment.teacherId == user.uid)

    assignments = await query.to_list()
    tests = []
    for assignment in assignments:
        test_data = assignment.model_dump()
        test_data["id"] = assignment.id
        tests.append(test_data)

    return {"tests": tests}

@app.get("/homework")
async def get_homework(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    assignments = await Assignment.find(Assignment.type == "homework").to_list()
    homework = []
    for assignment in assignments:
        homework_data = assignment.model_dump()
        homework_data["id"] = assignment.id
        homework.append(homework_data)

    return {"homework": homework}

@app.post("/attendance")
async def record_attendance(payload: AttendancePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    attendance = Attendance(
        teacherId=user.uid,
        classId=payload.class_id,
        date=payload.date,
        records=[rec.model_dump(by_alias=True) for rec in payload.records],
        notes=payload.notes,
    )

    await attendance.insert()

    record = attendance.model_dump()
    record["id"] = attendance.id
    return record


@app.post("/timetable")
async def upsert_timetable(payload: TimetablePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    # Try to find existing timetable
    existing = await Timetable.find_one(
        Timetable.classId == payload.class_id,
        Timetable.weekOf == payload.week_of
    )

    if existing:
        existing.entries = [entry.model_dump(by_alias=True) for entry in payload.entries]
        existing.updatedAt = datetime.utcnow()
        await existing.save()
        timetable = existing
    else:
        timetable = Timetable(
            teacherId=user.uid,
            classId=payload.class_id,
            weekOf=payload.week_of,
            entries=[entry.model_dump(by_alias=True) for entry in payload.entries],
        )
        await timetable.insert()

    record = timetable.model_dump()
    record["id"] = timetable.id
    return record


@app.get("/analytics")
async def analytics_dashboard(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    # Aggregation pipeline for missing assignments per student
    missing_assignments_pipeline = [
        {
            "$lookup": {
                "from": "assignments",
                "localField": "assignmentId",
                "foreignField": "_id",
                "as": "assignment"
            }
        },
        {
            "$unwind": "$assignment"
        },
        {
            "$match": {
                "assignment.dueDate": {"$lt": datetime.utcnow().isoformat()},
                "status": {"$nin": ["submitted", "completed"]}
            }
        },
        {
            "$group": {
                "_id": "$studentId",
                "missingCount": {"$sum": 1},
                "assignments": {
                    "$push": {
                        "id": "$assignment._id",
                        "title": "$assignment.title",
                        "dueDate": "$assignment.dueDate",
                        "subject": "$assignment.subject"
                    }
                }
            }
        },
        {
            "$sort": {"missingCount": -1}
        }
    ]

    # Aggregation pipeline for average class mood from check-ins
    mood_analytics_pipeline = [
        {
            "$match": {
                "timestamp": {
                    "$gte": datetime.utcnow() - timedelta(days=30)  # Last 30 days
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "totalCheckins": {"$sum": 1},
                "avgStressLevel": {"$avg": "$stressLevel"},
                "moodCounts": {
                    "$push": "$mood"
                },
                "recentCheckins": {
                    "$push": {
                        "studentId": "$studentId",
                        "mood": "$mood",
                        "stressLevel": "$stressLevel",
                        "timestamp": "$timestamp"
                    }
                }
            }
        },
        {
            "$project": {
                "totalCheckins": 1,
                "avgStressLevel": {"$round": ["$avgStressLevel", 1]},
                "moodDistribution": {
                    "$arrayToObject": {
                        "$map": {
                            "input": {"$setUnion": ["$moodCounts"]},
                            "as": "mood",
                            "in": {
                                "k": "$$mood",
                                "v": {
                                    "$size": {
                                        "$filter": {
                                            "input": "$moodCounts",
                                            "cond": {"$eq": ["$$this", "$$mood"]}
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "recentCheckins": {"$slice": ["$recentCheckins", 10]}
            }
        }
    ]

    from motor.motor_asyncio import AsyncIOMotorClient
    from database import get_database

    db = get_database()

    # Execute aggregation pipelines
    missing_assignments_result = await db.studentSubmissions.aggregate(missing_assignments_pipeline).to_list(length=None)
    mood_analytics_result = await db.checkins.aggregate(mood_analytics_pipeline).to_list(length=1)

    # Process missing assignments data
    missing_assignments = []
    for result in missing_assignments_result:
        student_doc = await User.find_one(User.id == result["_id"])
        student_name = "Unknown Student"
        if student_doc and student_doc.profile and student_doc.profile.name:
            student_name = student_doc.profile.name
        elif student_doc:
            student_name = student_doc.email

        missing_assignments.append({
            "studentId": result["_id"],
            "studentName": student_name,
            "missingCount": result["missingCount"],
            "assignments": result["assignments"][:5]  # Limit to 5 assignments
        })

    # Process mood analytics data
    mood_analytics = {}
    if mood_analytics_result:
        result = mood_analytics_result[0]
        mood_analytics = {
            "totalCheckins": result.get("totalCheckins", 0),
            "avgStressLevel": result.get("avgStressLevel", 0),
            "moodDistribution": result.get("moodDistribution", {}),
            "recentCheckins": result.get("recentCheckins", [])
        }

    return {
        "missingAssignments": missing_assignments,
        "moodAnalytics": mood_analytics,
        "generatedAt": datetime.utcnow().isoformat()
    }

@app.get("/analytics/alerts")
async def analytics_alerts(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    alerts_map: Dict[str, Dict[str, Any]] = {}
    history_map: Dict[str, Dict[str, Any]] = defaultdict(dict)
    LOW_MOOD_STATES = {"sad", "anxious", "stressed", "tired", "overwhelmed"}

    # Get all checkins
    checkins = await CheckIn.find().to_list()
    checkins_by_student: Dict[str, List[CheckIn]] = defaultdict(list)

    for checkin in checkins:
        student_id = checkin.studentId
        checkins_by_student[student_id].append(checkin)

        mood = (checkin.mood or "").lower()
        stress_level = checkin.stressLevel
        if mood in LOW_MOOD_STATES or stress_level >= 7:
            entry = _ensure_alert_entry(alerts_map, student_id)
            entry["signals"].append({
                "category": "wellbeing",
                "description": f"Low mood '{mood or 'unknown'}' with stress level {stress_level}",
                "source": checkin.model_dump(),
            })
            entry["riskScore"] += 20

    # Check for mood streaks
    for student_id, records in checkins_by_student.items():
        sorted_records = sorted(records, key=lambda item: item.timestamp, reverse=True)
        history_map[student_id]["recentCheckins"] = [r.model_dump() for r in sorted_records[:7]]
        streak = 0
        for record in sorted_records:
            if (record.mood or "").lower() in LOW_MOOD_STATES:
                streak += 1
            else:
                break
        if streak >= 5:
            entry = _ensure_alert_entry(alerts_map, student_id)
            entry["signals"].append({
                "category": "pattern",
                "description": f"Low mood reported for {streak} consecutive check-ins.",
                "source": {"recentCheckins": [r.model_dump() for r in sorted_records[:streak]]},
            })
            entry["riskScore"] += 25

    # Get assignments and submissions
    assignments = await Assignment.find().to_list()
    assignments_index = {assignment.id: assignment for assignment in assignments}

    submissions = await StudentSubmission.find().to_list()
    submissions_by_student: Dict[str, List[StudentSubmission]] = defaultdict(list)

    for submission in submissions:
        submissions_by_student[submission.studentId].append(submission)

    # Check for missed assignments
    now = datetime.utcnow()
    for student_id, student_submissions in submissions_by_student.items():
        missed: List[Dict[str, Any]] = []
        for submission in student_submissions:
            assignment = assignments_index.get(submission.assignmentId)
            if not assignment or not assignment.dueDate:
                continue

            try:
                due = datetime.fromisoformat(assignment.dueDate.replace("Z", "+00:00"))
                if due < now and submission.status not in {"submitted", "completed"}:
                    missed.append({
                        "assignmentId": submission.assignmentId,
                        "title": assignment.title,
                        "dueDate": assignment.dueDate,
                        "status": submission.status,
                    })
            except ValueError:
                continue  # Skip invalid dates

        if len(missed) >= 3:
            entry = _ensure_alert_entry(alerts_map, student_id)
            entry["signals"].append({
                "category": "academic",
                "description": f"{len(missed)} past-due assignments without submissions.",
                "source": {"missedAssignments": missed[:5]},
            })
            entry["riskScore"] += 20
            history_map[student_id]["missedAssignments"] = missed[:5]

    # If no alerts, create positive alerts for active students
    if not alerts_map:
        recent_checkins = await CheckIn.find().sort([("timestamp", -1)]).limit(5).to_list()
        seen_students = set()
        for checkin in recent_checkins:
            sid = checkin.studentId
            if sid not in seen_students:
                seen_students.add(sid)
                entry = _ensure_alert_entry(alerts_map, sid)
                entry["signals"].append({
                    "category": "positive",
                    "description": "Consistent check-ins and stable mood reported.",
                    "source": checkin.model_dump(),
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
