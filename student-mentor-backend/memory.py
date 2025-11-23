from collections import defaultdict
from typing import Dict

try:
    from google.adk.memory import InMemorySessionService, MemoryBank
except ImportError:  # pragma: no cover - ADK 0.3 compatibility shim.
    from google.adk.sessions import InMemorySessionService  # type: ignore

    class MemoryBank:
        """Minimal in-memory store used when ADK MemoryBank is unavailable."""

        def __init__(self, name: str):
            self.name = name
            self._memories: Dict[str, list[str]] = defaultdict(list)

        def add_memory(self, student_id: str, memory: str) -> None:
            self._memories[student_id].append(memory)

try:
    session_service = InMemorySessionService(id_field="student_id")
except TypeError:  # pragma: no cover - older ADK signature has no kwargs.
    session_service = InMemorySessionService()
memory_bank = MemoryBank(name="student_long_term")


def summarize_checkin(data: Dict[str, str]) -> str:
    feeling = data.get("mood") or data.get("feeling") or "unknown"
    win = data.get("win") or "none"
    main_achievement = data.get("mainAchievement") or "none"
    blocker = data.get("blocker") or "none"
    main_mistake = data.get("mainMistake") or "none"
    critical_observation = data.get("criticalObservation") or "none"
    plan_for_tomorrow = data.get("planForTomorrow") or "none"
    sleep_hours = data.get("sleepHours") or "unknown"
    study_hours = data.get("studyHours") or "unknown"
    classes_attended = data.get("classesAttended") or "unknown"

    # Create a comprehensive summary for AI analysis
    summary_parts = [
        f"Mood: {feeling}",
        f"Sleep: {sleep_hours}h",
        f"Study: {study_hours}h",
        f"Classes: {classes_attended}",
        f"Win: {win}",
        f"Achievement: {main_achievement}",
        f"Blocker: {blocker}",
        f"Mistake: {main_mistake}",
        f"Observation: {critical_observation}",
        f"Tomorrow: {plan_for_tomorrow}"
    ]

    return " | ".join(summary_parts)
