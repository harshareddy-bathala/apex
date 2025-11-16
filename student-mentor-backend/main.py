from collections import defaultdict
import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict, EmailStr

from agents import analytics_agent, get_student_hub_agent, onboarding_agent
from auth import FirebaseUser, verify_firebase_token
from memory import session_service
from db import collection_ref, student_profile_doc, user_doc

app = FastAPI(title="Student Mentor AI Backend")

student_hub_agent = get_student_hub_agent()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatPayload(BaseModel):
    student_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)


class OnboardingChatPayload(BaseModel):
    message: str = Field(..., min_length=1)


class ProfileUpdatePayload(BaseModel):
    """Flexible payload for partial student profile updates."""

    model_config = ConfigDict(extra="allow")

    name: str | None = None
    date_of_birth: str | None = Field(default=None, alias="dateOfBirth")


class CheckInPayload(BaseModel):
    """Minimal required fields for daily check-ins; accepts extra telemetry."""

    model_config = ConfigDict(extra="allow")

    mood: str = Field(..., min_length=1)
    win: str | None = None
    blocker: str | None = None


class GoalUpdatePayload(BaseModel):
    goals: Any


class CreateUserDocPayload(BaseModel):
    uid: str = Field(..., min_length=1)
    email: EmailStr


def _ensure_student(user: FirebaseUser) -> None:
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students may access this endpoint")


def _ensure_teacher(user: FirebaseUser) -> None:
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers may access this endpoint")


class AssignmentPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    title: str
    class_id: str = Field(..., alias="classId")
    subject: str | None = None
    type: str | None = None
    due_date: str | None = Field(default=None, alias="dueDate")
    description: str | None = None
    instructions: str | None = None
    attachments: List[str] | None = None
    student_ids: List[str] | None = Field(default=None, alias="studentIds")


class AttendanceRecord(BaseModel):
    student_id: str = Field(..., alias="studentId")
    status: str = Field(..., pattern="^(present|absent|late)$")
    notes: str | None = None


class AttendancePayload(BaseModel):
    class_id: str = Field(..., alias="classId")
    date: str
    records: List[AttendanceRecord]
    notes: str | None = None


class TimetableEntry(BaseModel):
    day: str
    start_time: str = Field(..., alias="startTime")
    end_time: str = Field(..., alias="endTime")
    subject: str
    location: str | None = None


class TimetablePayload(BaseModel):
    class_id: str = Field(..., alias="classId")
    week_of: str = Field(..., alias="weekOf")
    entries: List[TimetableEntry]


LOW_MOOD_STATES = {"stressed", "struggling"}
ALERT_WEIGHTS = {
    "wellbeing": 3,
    "academic": 2,
    "attendance": 2,
}


def _add_signal(
    alerts: Dict[str, Dict[str, Any]],
    student_id: str,
    category: str,
    description: str,
    source: Dict[str, Any],
) -> None:
    alert = alerts.setdefault(student_id, {"studentId": student_id, "signals": [], "riskScore": 0})
    student_name = source.get("studentName") or source.get("student_name")
    if student_name:
        alert["studentName"] = student_name
    alert["signals"].append({"category": category, "description": description, "source": source})
    alert["riskScore"] += ALERT_WEIGHTS.get(category, 1)


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _is_overdue(due_date: str | None) -> bool:
    parsed = _parse_iso_datetime(due_date)
    if not parsed:
        return False
    return parsed < datetime.now(timezone.utc)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.post("/auth/create-user-doc")
async def create_user_doc(payload: CreateUserDocPayload) -> Dict[str, Any]:
    doc = collection_ref("users").document(payload.uid)
    snapshot = doc.get()
    existing = snapshot.to_dict() if snapshot.exists else {}
    created_at = existing.get("createdAt") or _utc_now()
    record = {
        "uid": payload.uid,
        "email": payload.email,
        "role": "student",
        "createdAt": created_at,
        "updatedAt": _utc_now(),
    }
    doc.set(record, merge=True)
    return record


@app.get("/health")
async def health(_: FirebaseUser = Depends(verify_firebase_token)) -> dict[str, str]:
    return {"status": "ok"}


async def stream_agent_reply(student_id: str, message: str) -> AsyncGenerator[bytes, None]:
    session = session_service.get_session(student_id)
    try:
        async for chunk in student_hub_agent.stream(message, session=session):
            text = getattr(chunk, "text", None) or str(chunk)
            payload = f"data: {text}\n\n".encode("utf-8")
            yield payload
        yield b"data: [DONE]\n\n"
    except Exception as exc:  # pragma: no cover - surfaced to client instead
        raise HTTPException(status_code=500, detail=str(exc)) from exc


async def stream_onboarding_reply(student_id: str, message: str) -> AsyncGenerator[bytes, None]:
    session = session_service.get_session(f"onboarding:{student_id}")
    try:
        async for chunk in onboarding_agent.stream(message, session=session):
            text = getattr(chunk, "text", None) or str(chunk)
            payload = f"data: {text}\n\n".encode("utf-8")
            yield payload
        yield b"data: [DONE]\n\n"
    except Exception as exc:  # pragma: no cover - surfaced to client instead
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/chat")
async def chat(payload: ChatPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> StreamingResponse:
    if user.role == "student" and payload.student_id != user.uid:
        raise HTTPException(status_code=403, detail="Students may only chat as themselves")

    generator = stream_agent_reply(payload.student_id, payload.message)
    return StreamingResponse(generator, media_type="text/event-stream")


@app.post("/onboarding/chat")
async def onboarding_chat(payload: OnboardingChatPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> StreamingResponse:
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students may access onboarding chat")

    generator = stream_onboarding_reply(user.uid, payload.message)
    return StreamingResponse(generator, media_type="text/event-stream")


@app.post("/profile/update")
async def update_profile(payload: ProfileUpdatePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_student(user)

    updates = payload.model_dump(exclude_none=True, by_alias=True)
    updates.pop("date_of_birth", None)  # prefer camelCase for Firestore consistency
    if "dateOfBirth" not in updates and payload.date_of_birth:
        updates["dateOfBirth"] = payload.date_of_birth

    if not updates:
        raise HTTPException(status_code=400, detail="No profile fields provided")

    doc = student_profile_doc(user.uid)
    merged_payload = {"id": user.uid, **updates, "updatedAt": _utc_now()}
    doc.set(merged_payload, merge=True)
    snapshot = doc.get()
    data = snapshot.to_dict() or merged_payload
    data.setdefault("id", user.uid)
    return data


@app.get("/profile")
async def get_profile(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    if user.role == "teacher":
        snapshot = user_doc(user.uid).get()
        data = snapshot.to_dict() or {}
    else:
        snapshot = student_profile_doc(user.uid).get()
        data = snapshot.to_dict() or {}

    data.setdefault("id", user.uid)
    data["role"] = user.role
    if user.email:
        data.setdefault("email", user.email)
    return data


@app.post("/checkin")
async def create_checkin(payload: CheckInPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_student(user)

    data = payload.model_dump(exclude_none=True)
    doc_ref = collection_ref("checkins").document()
    record = {
        "id": doc_ref.id,
        "studentId": user.uid,
        "createdAt": _utc_now(),
        **data,
    }
    doc_ref.set(record)
    return record


@app.get("/goals")
async def get_goals(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_student(user)

    snapshot = student_profile_doc(user.uid).get()
    if not snapshot.exists:
        return {"goals": None}
    data = snapshot.to_dict() or {}
    return {"goals": data.get("goals")}


@app.post("/goal")
async def update_goals(payload: GoalUpdatePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_student(user)

    doc = student_profile_doc(user.uid)
    doc.set({"id": user.uid, "goals": payload.goals, "updatedAt": _utc_now()}, merge=True)
    return {"goals": payload.goals}


@app.get("/homework")
async def list_homework(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, List[Dict[str, Any]]]:
    _ensure_student(user)

    submissions_ref = collection_ref("studentSubmissions")
    query = submissions_ref.where("studentId", "==", user.uid)
    homework_items: List[Dict[str, Any]] = []
    for doc in query.stream():
        item = doc.to_dict() or {}
        item.setdefault("id", doc.id)
        homework_items.append(item)
    return {"homework": homework_items}


@app.post("/assignment")
async def create_assignment(payload: AssignmentPayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    data = payload.model_dump(by_alias=True, exclude_none=True)
    assignments = collection_ref("assignments")
    doc_ref = assignments.document()
    record = {
        "id": doc_ref.id,
        **data,
        "teacherId": user.uid,
        "createdAt": _utc_now(),
    }
    doc_ref.set(record)

    # Optionally seed student submissions for targeted students
    student_ids = data.get("studentIds") or []
    if student_ids:
        submissions = collection_ref("studentSubmissions")
        for student_id in student_ids:
            submissions.add(
                {
                    "assignmentId": doc_ref.id,
                    "studentId": student_id,
                    "status": "pending",
                    "createdAt": _utc_now(),
                }
            )

    return record


@app.post("/attendance")
async def record_attendance(payload: AttendancePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    attendance_collection = collection_ref("attendance")
    doc_ref = attendance_collection.document()
    records = [rec.model_dump(by_alias=True) for rec in payload.records]
    record = {
        "id": doc_ref.id,
        "teacherId": user.uid,
        "classId": payload.class_id,
        "date": payload.date,
        "records": records,
        "notes": payload.notes,
        "createdAt": _utc_now(),
    }
    doc_ref.set(record)
    return record


@app.post("/timetable")
async def upsert_timetable(payload: TimetablePayload, user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    timetable_collection = collection_ref("timetables")
    doc_id = f"{payload.class_id}-{payload.week_of}"
    doc_ref = timetable_collection.document(doc_id)
    record = {
        "id": doc_id,
        "teacherId": user.uid,
        "classId": payload.class_id,
        "weekOf": payload.week_of,
        "entries": [entry.model_dump(by_alias=True) for entry in payload.entries],
        "updatedAt": _utc_now(),
    }
    doc_ref.set(record)
    return record


@app.get("/analytics/alerts")
async def analytics_alerts(user: FirebaseUser = Depends(verify_firebase_token)) -> Dict[str, Any]:
    _ensure_teacher(user)

    alerts_map: Dict[str, Dict[str, Any]] = {}

    # Wellbeing signals from check-ins
    for doc in collection_ref("checkins").stream():
        checkin = doc.to_dict() or {}
        student_id = checkin.get("studentId")
        if not student_id:
            continue
        mood = (checkin.get("mood") or "").lower()
        stress_level = int(checkin.get("stressLevel") or 0)
        if mood in LOW_MOOD_STATES or stress_level >= 7:
            description = f"Low mood '{mood or 'unknown'}' with stress level {stress_level}"
            _add_signal(alerts_map, student_id, "wellbeing", description, checkin | {"id": doc.id})

    # Academic signals from student submissions
    for doc in collection_ref("studentSubmissions").stream():
        submission = doc.to_dict() or {}
        student_id = submission.get("studentId")
        if not student_id:
            continue
        status = (submission.get("status") or "pending").lower()
        due_date = submission.get("dueDate")
        if status in {"pending", "overdue"} and _is_overdue(due_date):
            title = submission.get("title") or submission.get("assignmentTitle") or "Assignment"
            description = f"Missing {title} (status: {status})"
            _add_signal(alerts_map, student_id, "academic", description, submission | {"id": doc.id})

    # Attendance signals from teacher attendance logs
    for doc in collection_ref("attendance").stream():
        attendance = doc.to_dict() or {}
        date = attendance.get("date")
        for record in attendance.get("records", []):
            student_id = record.get("studentId")
            if not student_id or record.get("status") != "absent":
                continue
            description = f"Absent on {date or 'recent session'}"
            _add_signal(alerts_map, student_id, "attendance", description, {"date": date, **record})

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
        except Exception:  # pragma: no cover - analytics agent errors are non-fatal
            continue

    return {"alerts": alerts}
