from __future__ import annotations

import json
from datetime import datetime
from typing import Callable, Dict, Optional

try:
    from google.adk.tools import tool
except ImportError:  # pragma: no cover - ADK 0.3 fallback decorator.
    def tool(func):
        return func

from models import (
    User, Habit, CommunityPost, Resource, Assignment,
    CheckIn, StudentSubmission
)
from memory import memory_bank, summarize_checkin

analytics_runner: Optional[Callable[[str, str], str]] = None


def register_analytics_runner(callback: Callable[[str, str], str]) -> None:
    global analytics_runner
    analytics_runner = callback


@tool
async def get_assignments_for_student(student_id: str) -> str:
    """Return submissions plus assignment metadata for a student."""

    submissions = await StudentSubmission.find(StudentSubmission.studentId == student_id).to_list()
    assignment_cache: Dict[str, Optional[Dict[str, object]]] = {}
    payload = []

    for submission in submissions:
        submission_data = submission.model_dump()
        assignment_id = submission.assignmentId
        if assignment_id:
            if assignment_id not in assignment_cache:
                assignment = await Assignment.find_one(Assignment.id == assignment_id)
                assignment_cache[assignment_id] = (
                    assignment.model_dump() | {"id": assignment.id}
                    if assignment
                    else None
                )
            assignment_data = assignment_cache.get(assignment_id)
            if assignment_data:
                submission_data["assignment"] = assignment_data
        payload.append(submission_data)

    return json.dumps(payload)


@tool
async def create_assignment(teacher_id: str, assignment_payload: str) -> str:
    """Create an assignment and optional student submissions."""

    data = json.loads(assignment_payload)
    student_ids = data.pop("studentIds", [])

    # Create assignment
    assignment = Assignment(
        title=data.get("title", ""),
        subject=data.get("subject"),
        type=data.get("type", "homework"),
        dueDate=data.get("dueDate"),
        description=data.get("description"),
        instructions=data.get("instructions"),
        attachments=data.get("attachments", []),
        studentIds=student_ids,
        priority=data.get("priority", "medium"),
        estimatedTime=data.get("estimatedTime"),
        teacherId=teacher_id,
        classId=data.get("classId", ""),
    )

    await assignment.insert()

    created_submissions = 0
    for student_id in student_ids:
        submission = StudentSubmission(
            assignmentId=assignment.id,
            studentId=student_id,
            status="pending"
        )
        await submission.insert()
        created_submissions += 1

    return json.dumps({"assignmentId": assignment.id, "linkedStudents": created_submissions})


@tool
async def get_student_profile(student_id: str) -> str:
    """Fetch a student's profile document."""

    user = await User.find_one(User.id == student_id)
    if not user or not user.profile:
        return json.dumps({})

    profile_data = user.profile.model_dump()
    profile_data["id"] = user.id
    return json.dumps(profile_data)


@tool
async def update_student_goals(student_id: str, goals_payload: str) -> str:
    """Update the goals array on a student's profile and write to memory."""

    goals = json.loads(goals_payload)
    if not isinstance(goals, list):
        raise ValueError("Goals payload must be a JSON array of strings")

    user = await User.find_one(User.id == student_id)
    if not user:
        raise ValueError(f"User {student_id} not found")

    if not user.profile:
        from models import Profile
        user.profile = Profile()

    user.profile.goals = goals
    user.updatedAt = datetime.utcnow()
    await user.save()

    memory_bank.add_memory(student_id, f"Goals updated: {', '.join(goals)}")
    return json.dumps({"status": "ok", "goalCount": len(goals)})


@tool
async def save_student_profile_data(student_id: str, data_to_save: str) -> str:
    """Merge onboarding responses into the student's profile document."""

    try:
        payload = json.loads(data_to_save)
    except json.JSONDecodeError as exc:  # pragma: no cover - surface error upstream
        raise ValueError("data_to_save must be valid JSON") from exc

    if not isinstance(payload, dict):
        raise ValueError("data_to_save must be a JSON object")

    user = await User.find_one(User.id == student_id)
    if not user:
        raise ValueError(f"User {student_id} not found")

    if not user.profile:
        from models import Profile
        user.profile = Profile()

    # Update profile fields dynamically
    for key, value in payload.items():
        if hasattr(user.profile, key):
            setattr(user.profile, key, value)

    user.updatedAt = datetime.utcnow()
    await user.save()

    return json.dumps({"status": "ok", "updatedFields": sorted(payload.keys())})


@tool
async def record_daily_checkin(student_id: str, mood: str, win: str, blocker: str = "") -> str:
    """Persist the new check-in model and log a memory summary."""

    checkin = CheckIn(
        studentId=student_id,
        mood=mood,
        stressLevel=5,  # Default stress level since it's not provided
        sleepHours=8,    # Default sleep hours since it's not provided
        notes=f"Win: {win}" + (f" | Blocker: {blocker}" if blocker else ""),
    )

    await checkin.insert()

    stored_data = {
        "studentId": student_id,
        "mood": mood,
        "win": win,
        "blocker": blocker,
    }
    memory_bank.add_memory(student_id, summarize_checkin(stored_data))
    return json.dumps({"checkinId": checkin.id})


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
async def get_upcoming_assignments(student_id: str) -> str:
    """Fetch all upcoming assignments (homework/tests) that are not yet submitted."""

    # Get student's existing submissions to exclude them
    submissions = await StudentSubmission.find(StudentSubmission.studentId == student_id).to_list()
    submitted_assignment_ids = {sub.assignmentId for sub in submissions}

    # Get all active assignments that are not submitted by this student
    assignments = await Assignment.find(
        Assignment.status == "active",
        Assignment.id.not_in(submitted_assignment_ids)
    ).to_list()

    upcoming = []
    for assignment in assignments:
        upcoming.append({
            "id": assignment.id,
            "title": assignment.title,
            "subject": assignment.subject,
            "type": assignment.type,
            "dueDate": assignment.dueDate,
            "priority": assignment.priority,
            "estimatedTime": assignment.estimatedTime
        })

    return json.dumps(upcoming)


@tool
async def get_community_posts(subject: str = "", query: str = "", limit: int = 5) -> str:
    """Return recent community posts filtered by subject or keyword."""

    # Build query
    posts_query = CommunityPost.find(CommunityPost.parentId == None)  # Only top-level posts

    if subject:
        posts_query = posts_query.find(CommunityPost.subject == subject)

    # Get posts
    posts = await posts_query.sort([("createdAt", -1)]).to_list(limit=max(1, min(limit, 10)))

    # Filter by search query if provided
    normalized_query = (query or "").lower()
    if normalized_query:
        filtered_posts = []
        for post in posts:
            haystack = " ".join([
                post.content or "",
                post.subject or "",
                " ".join(post.tags or []),
            ]).lower()
            if normalized_query in haystack:
                filtered_posts.append(post)
        posts = filtered_posts

    # Convert to response format
    result = []
    for post in posts:
        record = {
            "id": post.id,
            "authorName": post.authorName,
            "subject": post.subject,
            "content": post.content,
            "tags": post.tags,
            "upvoteCount": post.upvoteCount,
            "replyCount": post.replyCount,
            "createdAt": post.createdAt.isoformat(),
        }
        result.append(record)

    return json.dumps(result)


@tool
async def get_resources(subject: str = "", topic: str = "", query: str = "", limit: int = 5) -> str:
    """Return shared study resources with optional subject/topic filters."""

    # Build query
    resources_query = Resource.find()

    if subject:
        resources_query = resources_query.find(Resource.subject == subject)
    if topic:
        resources_query = resources_query.find(Resource.topic == topic)

    # Get resources
    resources = await resources_query.sort([("createdAt", -1)]).to_list(limit=max(1, min(limit, 15)))

    # Filter by search query if provided
    normalized_query = (query or "").lower()
    if normalized_query:
        filtered_resources = []
        for resource in resources:
            haystack = " ".join([
                resource.title or "",
                resource.subject or "",
                resource.topic or "",
                resource.description or "",
            ]).lower()
            if normalized_query in haystack:
                filtered_resources.append(resource)
        resources = filtered_resources

    # Convert to response format
    result = []
    for resource in resources:
        record = {
            "id": resource.id,
            "title": resource.title,
            "subject": resource.subject,
            "topic": resource.topic,
            "url": resource.url,
            "description": resource.description,
            "tags": resource.tags,
            "createdByName": resource.createdByName,
        }
        result.append(record)

    return json.dumps(result)


@tool
async def get_student_habits(student_id: str) -> str:
    """Return the student's active habits with today's completion state."""

    today = datetime.utcnow().date().isoformat()

    habits = await Habit.find(
        Habit.user_email == student_id,
        Habit.archived == False
    ).to_list()

    # Check today's completions
    completed_habits = await Habit.find(
        Habit.user_email == student_id,
        Habit.completed_dates == today
    ).to_list()

    completed_ids = {habit.id for habit in completed_habits}

    payload = []
    for habit in habits:
        payload.append({
            "id": habit.id,
            "name": habit.title,
            "timeOfDay": habit.timeOfDay,
            "completedToday": habit.id in completed_ids,
            "lastCompletedAt": habit.lastCompletedAt,
        })

    return json.dumps(payload)


@tool
async def record_habit_checkin(student_id: str, habit_id: str, completed: bool = True) -> str:
    """Mark or clear a habit check-in for today."""

    habit = await Habit.find_one(Habit.id == habit_id, Habit.user_email == student_id)
    if not habit:
        raise ValueError(f"Habit {habit_id} not found for student {student_id}")

    today = datetime.utcnow().date().isoformat()

    if completed:
        if today not in habit.completed_dates:
            habit.completed_dates.append(today)
            habit.lastCompletedAt = today
            await habit.save()
    else:
        if today in habit.completed_dates:
            habit.completed_dates.remove(today)
            # Update lastCompletedAt to the most recent remaining date
            if habit.completed_dates:
                habit.lastCompletedAt = max(habit.completed_dates)
            else:
                habit.lastCompletedAt = None
            await habit.save()

    return json.dumps({"status": "ok", "completed": completed})