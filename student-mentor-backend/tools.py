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
async def analyze_checkin_insights(
    student_id: str,
    mood: str,
    sleep_hours: float,
    study_hours: float,
    classes_attended: int,
    win: str = "",
    main_achievement: str = "",
    blocker: str = "",
    main_mistake: str = "",
    critical_observation: str = "",
    plan_for_tomorrow: str = ""
) -> str:
    """Analyze student's daily check-in data and provide personalized insights and recommendations."""
    try:
        # Get recent check-ins for context
        recent_checkins = await CheckIn.find(
            CheckIn.studentId == student_id
        ).sort([("timestamp", -1)]).limit(7).to_list()

        # Get student profile for context
        profile = await User.find_one(User.id == student_id)

        # Analyze patterns and provide insights
        insights = []

        # Sleep analysis
        if sleep_hours < 7:
            insights.append("⚠️ Consider getting more sleep - you're getting less than 7 hours, which can impact academic performance.")
        elif sleep_hours >= 8:
            insights.append("✅ Great job prioritizing sleep! 8+ hours will help with focus and memory.")

        # Study analysis
        if study_hours < 2:
            insights.append("💡 Consider increasing study time. Consistent daily study builds strong habits.")
        elif study_hours > 4:
            insights.append("⚠️ Don't forget to balance study with rest. Quality over quantity matters.")

        # Classes attended
        if classes_attended < 3:
            insights.append("📚 Try to attend more classes. Regular attendance is key to academic success.")

        # Mood and achievement analysis
        if mood in ['excellent', 'good'] and main_achievement:
            insights.append(f"🎉 Excellent work on '{main_achievement}'! Keep building on this success.")
        elif mood in ['stressed', 'struggling'] and blocker:
            insights.append(f"🤝 Let's address '{blocker}'. Consider breaking it into smaller steps.")

        # Learning from mistakes
        if main_mistake:
            insights.append(f"📝 Learning opportunity: '{main_mistake}'. Use this to grow stronger tomorrow.")

        # Critical observations
        if critical_observation:
            insights.append(f"🔍 Insight noted: '{critical_observation}'. This awareness is powerful for growth.")

        # Tomorrow's plan
        if plan_for_tomorrow:
            insights.append(f"🎯 Tomorrow's focus: '{plan_for_tomorrow}'. Clear goals lead to clear results.")

        # Pattern analysis if we have recent data
        if len(recent_checkins) >= 3:
            avg_sleep = sum(c.sleepHours for c in recent_checkins) / len(recent_checkins)
            avg_study = sum(c.studyHours for c in recent_checkins) / len(recent_checkins)

            if avg_sleep < 7:
                insights.append("📊 Pattern: Your average sleep over the past week is below 7 hours. Prioritize sleep for better performance.")

            if avg_study < 1.5:
                insights.append("📊 Pattern: Your study average is low. Consider creating a consistent study routine.")

        # Personalized recommendations
        recommendations = [
            "💡 Daily Check-in Tip: Reflect on both successes and challenges - this builds self-awareness.",
            "🎯 Focus on progress, not perfection. Small daily improvements compound over time.",
            "🤝 Remember: Every expert was once a beginner. You're on the right path!",
        ]

        result = {
            "insights": insights,
            "recommendations": recommendations[:2],  # Limit to 2 recommendations
            "mood_trend": mood,
            "sleep_quality": "good" if sleep_hours >= 7 else "needs_improvement",
            "study_consistency": "good" if study_hours >= 1.5 else "needs_improvement"
        }

        return json.dumps(result, indent=2)

    except Exception as e:
        return json.dumps({
            "error": f"Failed to analyze check-in: {str(e)}",
            "insights": ["Unable to provide detailed analysis at this time."]
        })

async def record_daily_checkin(
    student_id: str,
    mood: str,
    win: str = "",
    blocker: str = "",
    sleep_hours: int = 7,
    study_hours: float = 0,
    classes_attended: int = 0,
    main_mistake: str = "",
    critical_observation: str = "",
    main_achievement: str = "",
    plan_for_tomorrow: str = ""
) -> str:
    """Persist the new check-in model and log a memory summary."""

    checkin = CheckIn(
        studentId=student_id,
        date=datetime.now().strftime('%Y-%m-%d'),
        mood=mood,
        stressLevel=5,  # Default stress level, could be calculated from mood
        sleepHours=float(sleep_hours),
        energyLevel=7,  # Default energy level
        studyHours=float(study_hours),
        classesAttended=classes_attended,
        win=win if win else None,
        blocker=blocker if blocker else None,
        mainMistake=main_mistake if main_mistake else None,
        criticalObservation=critical_observation if critical_observation else None,
        mainAchievement=main_achievement if main_achievement else None,
        planForTomorrow=plan_for_tomorrow if plan_for_tomorrow else None,
    )

    await checkin.insert()

    # Generate AI analysis of the check-in
    analysis = await analyze_checkin_insights(
        student_id=student_id,
        mood=mood,
        sleep_hours=float(sleep_hours),
        study_hours=float(study_hours),
        classes_attended=classes_attended,
        win=win,
        main_achievement=main_achievement,
        blocker=blocker,
        main_mistake=main_mistake,
        critical_observation=critical_observation,
        plan_for_tomorrow=plan_for_tomorrow
    )

    stored_data = {
        "studentId": student_id,
        "mood": mood,
        "sleepHours": str(sleep_hours),
        "studyHours": str(study_hours),
        "classesAttended": str(classes_attended),
        "win": win,
        "mainAchievement": main_achievement,
        "blocker": blocker,
        "mainMistake": main_mistake,
        "criticalObservation": critical_observation,
        "planForTomorrow": plan_for_tomorrow,
        "analysis": analysis
    }

    memory_bank.add_memory(student_id, summarize_checkin(stored_data))

    return json.dumps({
        "checkinId": checkin.id,
        "analysis": analysis
    })


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