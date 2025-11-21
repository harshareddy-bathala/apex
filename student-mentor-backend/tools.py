from __future__ import annotations

import json
from typing import Callable, Dict, Optional

try:
    from google.adk.tools import tool
except ImportError:  # pragma: no cover - ADK 0.3 fallback decorator.
    def tool(func):
        return func

from db_direct import add_document, get_document, query_collection, upsert_document
from memory import memory_bank, summarize_checkin

analytics_runner: Optional[Callable[[str, str], str]] = None


def register_analytics_runner(callback: Callable[[str, str], str]) -> None:
    global analytics_runner
    analytics_runner = callback


@tool
def get_assignments_for_student(student_id: str) -> str:
    """Return submissions plus assignment metadata for a student."""

    submissions = query_collection(
        "studentSubmissions",
        filters=[("studentId", "==", student_id)],
    )
    assignment_cache: Dict[str, Optional[Dict[str, object]]] = {}
    payload = []

    for submission in submissions:
        submission_data = dict(submission.data)
        submission_data["id"] = submission.id
        assignment_id = submission_data.get("assignmentId")
        if assignment_id:
            if assignment_id not in assignment_cache:
                assignment_doc = get_document("assignments", assignment_id)
                assignment_cache[assignment_id] = (
                    assignment_doc.data | {"id": assignment_doc.id}
                    if assignment_doc
                    else None
                )
            assignment_data = assignment_cache.get(assignment_id)
            if assignment_data:
                submission_data["assignment"] = assignment_data
        payload.append(submission_data)

    return json.dumps(payload)


@tool
def create_assignment(teacher_id: str, assignment_payload: str) -> str:
    """Create an assignment and optional student submissions."""

    data = json.loads(assignment_payload)
    student_ids = data.pop("studentIds", [])
    data["assignedBy"] = teacher_id
    timestamp_fields = ["createdAt"] if "createdAt" not in data else None

    assignment_doc = add_document(
        "assignments",
        data,
        server_timestamp_fields=timestamp_fields,
    )

    created_submissions = 0
    for student_id in student_ids:
        add_document(
            "studentSubmissions",
            {
                "assignmentId": assignment_doc.id,
                "studentId": student_id,
                "status": "pending",
            },
            server_timestamp_fields=["createdAt"],
        )
        created_submissions += 1

    return json.dumps({"assignmentId": assignment_doc.id, "linkedStudents": created_submissions})


@tool
def get_student_profile(student_id: str) -> str:
    """Fetch a student's profile document."""

    document = get_document("studentProfiles", student_id)
    if not document:
        return json.dumps({})

    data = dict(document.data)
    data["id"] = document.id
    return json.dumps(data)


@tool
def update_student_goals(student_id: str, goals_payload: str) -> str:
    """Update the goals array on a student's profile and write to memory."""

    goals = json.loads(goals_payload)
    if not isinstance(goals, list):
        raise ValueError("Goals payload must be a JSON array of strings")

    upsert_document(
        "studentProfiles",
        {
            "goals": goals,
        },
        document_id=student_id,
        merge=True,
        server_timestamp_fields=["updatedAt"],
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

    upsert_document(
        "studentProfiles",
        payload,
        document_id=student_id,
        merge=True,
        server_timestamp_fields=["updatedAt"],
    )

    return json.dumps({"status": "ok", "updatedFields": sorted(payload.keys())})


@tool
def record_daily_checkin(student_id: str, mood: str, win: str, blocker: str = "") -> str:
    """Persist the new check-in model and log a memory summary."""

    doc = add_document(
        "checkins",
        {
            "studentId": student_id,
            "mood": mood,
            "win": win,
            "blocker": blocker,
        },
        server_timestamp_fields=["createdAt"],
    )
    stored_data = doc.data or {
        "studentId": student_id,
        "mood": mood,
        "win": win,
        "blocker": blocker,
    }
    memory_bank.add_memory(student_id, summarize_checkin(stored_data))
    return json.dumps({"checkinId": doc.id})


@tool
def generate_teacher_report(student_id: str) -> str:
    if analytics_runner is None:
        raise RuntimeError("Analytics runner has not been registered")
    prompt = (
        "Summarize the student's performance, risks, and wins based on checkins, "
        "studentSubmissions, and assignment metadata. Highlight multi-day negative trends."
    )
    return analytics_runner(student_id, prompt)


@tool
def get_upcoming_assignments(student_id: str) -> str:
    """Fetch all upcoming assignments (homework/tests) that are not yet submitted."""
    
    # 1. Get all assignments (In a real app, filter by student's class/grade)
    # For this prototype, we fetch all active assignments
    all_assignments = query_collection("assignments", filters=[("status", "==", "active")])
    
    # 2. Get student's existing submissions to exclude them
    submissions = query_collection(
        "studentSubmissions",
        filters=[("studentId", "==", student_id)],
    )
    submitted_assignment_ids = {sub.data.get("assignmentId") for sub in submissions if sub.data}
    
    upcoming = []
    for doc in all_assignments:
        data = doc.data or {}
        if doc.id in submitted_assignment_ids:
            continue
            
        # Filter by due date if needed (optional, but good for "upcoming")
        # For now, return all non-submitted ones
        upcoming.append({
            "id": doc.id,
            "title": data.get("title"),
            "subject": data.get("subject"),
            "type": data.get("type", "homework"),
            "dueDate": data.get("dueDate"),
            "priority": data.get("priority", "medium"),
            "estimatedTime": data.get("estimatedTime")
        })
        
    return json.dumps(upcoming)


@tool
def get_community_posts(subject: str = "", query: str = "", limit: int = 5) -> str:
    """Return recent community posts filtered by subject or keyword."""

    filters = []
    if subject:
        filters.append(("subject", "==", subject))
    docs = query_collection("communityPosts", filters=filters)
    normalized_query = (query or "").lower()
    posts = []
    for doc in docs:
        data = doc.data or {}
        if data.get("parentId"):
            continue
        record = {
            "id": doc.id,
            "authorName": data.get("authorName"),
            "subject": data.get("subject"),
            "content": data.get("content"),
            "tags": data.get("tags", []),
            "upvoteCount": data.get("upvoteCount", 0),
            "replyCount": data.get("replyCount", 0),
            "createdAt": data.get("createdAt"),
        }
        if normalized_query:
            haystack = " ".join(
                [
                    record.get("content") or "",
                    record.get("subject") or "",
                    " ".join(record.get("tags") or []),
                ]
            ).lower()
            if normalized_query not in haystack:
                continue
        posts.append(record)

    posts = sorted(posts, key=lambda item: item.get("createdAt") or "", reverse=True)
    max_items = max(1, min(limit, 10))
    return json.dumps(posts[:max_items])


@tool
def get_resources(subject: str = "", topic: str = "", query: str = "", limit: int = 5) -> str:
    """Return shared study resources with optional subject/topic filters."""

    filters = []
    if subject:
        filters.append(("subject", "==", subject))
    if topic:
        filters.append(("topic", "==", topic))

    docs = query_collection("resources", filters=filters)
    normalized_query = (query or "").lower()
    resources = []
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
            "createdByName": data.get("createdByName"),
        }
        if normalized_query:
            haystack = " ".join(
                [
                    record.get("title") or "",
                    record.get("subject") or "",
                    record.get("topic") or "",
                    record.get("description") or "",
                ]
            ).lower()
            if normalized_query not in haystack:
                continue
        resources.append(record)

    resources = sorted(resources, key=lambda item: item.get("title") or "")
    max_items = max(1, min(limit, 15))
    return json.dumps(resources[:max_items])