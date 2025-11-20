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
    win = data.get("win") or data.get("achievements") or "none"
    blocker = data.get("blocker") or data.get("challenges") or "none"

    wins_text = win if isinstance(win, str) else ", ".join(win)
    blocker_text = blocker if isinstance(blocker, str) else ", ".join(blocker)

    return f"Mood: {feeling} | Win: {wins_text} | Blocker: {blocker_text}"
