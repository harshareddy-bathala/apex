from __future__ import annotations

import json
from typing import Callable, Optional

try:
    from google.adk.tools import tool
except ImportError:  # pragma: no cover - ADK 0.3 fallback decorator.
    def tool(func):
        return func
from google.cloud import firestore

from db import collection_ref
from memory import memory_bank, summarize_checkin

analytics_runner: Optional[Callable[[str, str], str]] = None


def register_analytics_runner(callback: Callable[[str, str], str]) -> None:
    global analytics_runner
    analytics_runner = callback


@tool
def get_assignments_for_student(student_id: str) -> str:
    """Return submissions plus assignment metadata for a student."""

    submissions = collection_ref("studentSubmissions").where("studentId", "==", student_id).stream()
    assignment_collection = collection_ref("assignments")
    payload = []

    for submission in submissions:
        submission_data = submission.to_dict() | {"id": submission.id}
        assignment_id = submission_data.get("assignmentId")
        if assignment_id:
            assignment_snapshot = assignment_collection.document(assignment_id).get()
            if assignment_snapshot.exists:
                submission_data["assignment"] = assignment_snapshot.to_dict() | {"id": assignment_snapshot.id}
        payload.append(submission_data)

    return json.dumps(payload)


@tool
def create_assignment(teacher_id: str, assignment_payload: str) -> str:
    """Create an assignment and optional student submissions."""

    data = json.loads(assignment_payload)
    student_ids = data.pop("studentIds", [])
    data["assignedBy"] = teacher_id
    data.setdefault("createdAt", firestore.SERVER_TIMESTAMP)

    assignments = collection_ref("assignments")
    assignment_ref = assignments.document()
    assignment_ref.set(data)

    submission_ref = collection_ref("studentSubmissions")
    created_submissions = 0
    for student_id in student_ids:
        submission_ref.add(
            {
                "assignmentId": assignment_ref.id,
                "studentId": student_id,
                "status": "pending",
                "createdAt": firestore.SERVER_TIMESTAMP,
            }
        )
        created_submissions += 1

    return json.dumps({"assignmentId": assignment_ref.id, "linkedStudents": created_submissions})


@tool
def get_student_profile(student_id: str) -> str:
    """Fetch a student's profile document."""

    snapshot = collection_ref("studentProfiles").document(student_id).get()
    if not snapshot.exists:
        return json.dumps({})

    data = snapshot.to_dict() or {}
    data["id"] = snapshot.id
    return json.dumps(data)


@tool
def update_student_goals(student_id: str, goals_payload: str) -> str:
    """Update the goals array on a student's profile and write to memory."""

    goals = json.loads(goals_payload)
    if not isinstance(goals, list):
        raise ValueError("Goals payload must be a JSON array of strings")

    profile_ref = collection_ref("studentProfiles").document(student_id)
    profile_ref.set(
        {
            "goals": goals,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    memory_bank.add_memory(student_id, f"Goals updated: {', '.join(goals)}")
    return json.dumps({"status": "ok", "goalCount": len(goals)})


@tool
def save_student_profile_data(student_id: str, data_to_save: str) -> str:
    """Merge onboarding responses into the student's profile document."""

    try:
        payload = json.loads(data_to_save)
    except json.JSONDecodeError as exc:  # pragma: no cover - surface error upstream
        raise ValueError("data_to_save must be valid JSON") from exc

    if not isinstance(payload, dict):
        raise ValueError("data_to_save must be a JSON object")

    profile_ref = collection_ref("studentProfiles").document(student_id)
    profile_ref.set(
        payload | {"updatedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )

    return json.dumps({"status": "ok", "updatedFields": sorted(payload.keys())})


@tool
def record_daily_checkin(student_id: str, mood: str, win: str, blocker: str = "") -> str:
    """Persist the new check-in model and log a memory summary."""

    data = {
        "studentId": student_id,
        "mood": mood,
        "win": win,
        "blocker": blocker,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    doc_ref = collection_ref("checkins").add(data)
    memory_bank.add_memory(student_id, summarize_checkin(data))
    return json.dumps({"checkinId": doc_ref.id})


@tool
def generate_teacher_report(student_id: str) -> str:
    if analytics_runner is None:
        raise RuntimeError("Analytics runner has not been registered")
    prompt = (
        "Summarize the student's performance, risks, and wins based on checkins, "
        "studentSubmissions, and assignment metadata. Highlight multi-day negative trends."
    )
    return analytics_runner(student_id, prompt)
