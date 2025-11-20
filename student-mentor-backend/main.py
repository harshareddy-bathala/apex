from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from google.cloud import firestore

app = FastAPI(title="Student Mentor Firestore Proxy", version="1.0.0")

FIRESTORE_PROJECT_ID = os.getenv("FIRESTORE_PROJECT_ID")
if not FIRESTORE_PROJECT_ID:
    raise RuntimeError("FIRESTORE_PROJECT_ID environment variable is required")

firestore_client = firestore.Client(project=FIRESTORE_PROJECT_ID, database="student-mentor-db")


class Filter(BaseModel):
    field: str
    op: str = Field(pattern=r"^(==)$")
    value: Any


class GetRequest(BaseModel):
    collection: str
    document_id: Optional[str] = Field(default=None, alias="documentId")
    filters: Optional[List[Filter]] = None
    limit: Optional[int] = None


class UpsertRequest(BaseModel):
    collection: str
    document_id: Optional[str] = Field(default=None, alias="documentId")
    data: Dict[str, Any]
    merge: bool = False
    server_timestamp_fields: List[str] = Field(default_factory=list, alias="serverTimestampFields")


def _apply_server_timestamps(payload: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
    if not fields:
        return payload

    def _set_value(obj: Dict[str, Any], path: List[str]) -> None:
        cursor = obj
        for key in path[:-1]:
            next_val = cursor.get(key)
            if not isinstance(next_val, dict):
                next_val = {}
            cursor[key] = next_val
            cursor = next_val
        cursor[path[-1]] = firestore.SERVER_TIMESTAMP

    for field in fields:
        if not field:
            continue
        _set_value(payload, field.split("."))
    return payload


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/get")
def get_documents(request: GetRequest) -> Dict[str, Any]:
    collection = firestore_client.collection(request.collection)

    if request.document_id:
        snapshot = collection.document(request.document_id).get()
        return {
            "documents": [
                {
                    "id": snapshot.id,
                    "exists": snapshot.exists,
                    "data": snapshot.to_dict() if snapshot.exists else None,
                }
            ]
        }

    query = collection
    for filt in request.filters or []:
        query = query.where(filt.field, filt.op, filt.value)
    if request.limit:
        query = query.limit(request.limit)

    documents = [
        {
            "id": snapshot.id,
            "exists": snapshot.exists,
            "data": snapshot.to_dict() if snapshot.exists else None,
        }
        for snapshot in query.stream()
    ]
    return {"documents": documents}


@app.post("/upsert")
def upsert_document(request: UpsertRequest) -> Dict[str, Any]:
    collection = firestore_client.collection(request.collection)
    doc_ref = collection.document(request.document_id) if request.document_id else collection.document()

    payload = _apply_server_timestamps(dict(request.data), request.server_timestamp_fields)
    doc_ref.set(payload, merge=request.merge)
    stored = doc_ref.get()
    if not stored.exists:
        raise HTTPException(status_code=500, detail="Document write failed")

<<<<<<< HEAD
    return {
        "id": doc_ref.id,
        "data": stored.to_dict() or {},
    }
=======
    delete_document("assignments", assignment_id)
    return {"status": "deleted", "id": assignment_id}


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
            _add_signal(alerts_map, student_id, "wellbeing", description, checkin | {"id": doc.id})

    # Academic signals from student submissions
    for doc in query_collection("studentSubmissions"):
        submission = dict(doc.data or {})
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
    for doc in query_collection("attendance"):
        attendance = dict(doc.data or {})
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
>>>>>>> parent of d5ae379d (fix the reload issue)
