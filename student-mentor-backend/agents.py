from __future__ import annotations

import os
from typing import Callable, Sequence

try:  # google-adk>=0.3.0 exposes LlmAgent; fall back gracefully otherwise.
    from google.adk.agents import Agent, LlmAgent, ParallelAgent, SequentialAgent
    _HAS_LLM_AGENT = True
except ImportError:  # pragma: no cover - legacy fallback for CI environments.
    from google.adk.agents import Agent, ParallelAgent, SequentialAgent

    LlmAgent = Agent  # type: ignore[assignment]
    _HAS_LLM_AGENT = False

try:
    from google.adk.types import Model
except ImportError:  # pragma: no cover - fallback when ADK lacks typed models.
    from dataclasses import dataclass

    @dataclass
    class Model:  # type: ignore[override]
        name: str
        temperature: float = 0.0

from memory import memory_bank, session_service
from tools import (
    create_assignment,
    generate_teacher_report,
    get_assignments_for_student,
    get_student_profile,
    record_daily_checkin,
    register_analytics_runner as _register_analytics_callback,
    save_student_profile_data,
    update_student_goals,
)

# Troubleshooting commands if ADK imports break after upgrades:
#   python -c "import google.adk.agents as g; print(dir(g))"
#   python -c "import google.adk, inspect; print(google.adk.__version__)"

def _make_model(
    model_name: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
    temperature: float = float(os.getenv("ADK_TEMPERATURE", "0.0")),
) -> Model:
    """Create an ADK Model spec. Must be offline-safe and not call remote APIs."""

    return Model(name=model_name, temperature=temperature)


def make_llm_agent(
    *,
    name: str,
    instruction: str,
    tools: Sequence[Callable[..., str]] | None = None,
    memory_enabled: bool = False,
) -> Agent:
    """Create consistent LLM agents without repeating boilerplate."""

    model = _make_model()
    tool_list = list(tools) if tools else []

    if not _HAS_LLM_AGENT:
        agent_kwargs: dict[str, object] = {
            "name": name,
            "instructions": instruction,
            "model": model.name,
            "tools": tool_list,
        }
        if memory_enabled:
            agent_kwargs["memory_bank"] = memory_bank
        return Agent(**agent_kwargs)

    agent_kwargs = {
        "name": name,
        "instruction": instruction,
        "model": model,
        "tools": tool_list,
    }

    try:
        return LlmAgent(**agent_kwargs)
    except Exception:  # pragma: no cover - fallback for legacy signatures/validation.
        fallback_kwargs = dict(agent_kwargs)
        fallback_kwargs["model"] = model.name
        return LlmAgent(**fallback_kwargs)


def register_analytics_runner(agent: Agent) -> None:
    """Wire the analytics agent into Firestore-powered reporting hooks."""

    def _runner(student_id: str, prompt: str) -> str:
        session = session_service.get_session(f"analytics:{student_id}")
        return str(agent.run(prompt, session=session))

    _register_analytics_callback(_runner)


onboarding_agent = make_llm_agent(
    name="onboarding_agent",
    instruction=(
        "Warmly greet new students, ask for their name/class, then collect goals, challenges, "
        "and interests. Reflect prior answers to keep the chat personal."
    ),
    tools=[save_student_profile_data],
    memory_enabled=True,
)

tutor_agent = make_llm_agent(
    name="tutor_agent",
    instruction=(
        "Coach students on assignments, study plans, and wellbeing check-ins. Use tools to "
        "retrieve assignments and log daily reflections before responding."
    ),
    tools=[get_assignments_for_student, record_daily_checkin, generate_teacher_report],
    memory_enabled=True,
)

planner_agent = make_llm_agent(
    name="planner_agent",
    instruction=(
        "Act as a long-term planner who keeps student profiles and goals in sync. Suggest "
        "next steps after reading their saved history."
    ),
    tools=[get_student_profile, update_student_goals],
    memory_enabled=True,
)

analytics_agent = make_llm_agent(
    name="analytics_agent",
    instruction=(
        "Quietly analyze past sessions, submissions, and check-ins to detect risks or progress. "
        "Only output summaries or structured insights."
    ),
    memory_enabled=True,
)

register_analytics_runner(analytics_agent)

specialist_parallel = ParallelAgent(
    name="student_specialists_parallel",
    sub_agents=[tutor_agent, planner_agent, analytics_agent],
)

# Adjust orchestration by reordering the list below or adding new sub-agents.
student_hub_agent = SequentialAgent(
    name="student_hub_agent",
    sub_agents=[
        onboarding_agent,
        specialist_parallel,
    ],
)


def get_student_hub_agent() -> SequentialAgent:
    """Accessor for dependency injection or future hot-reload support."""

    return student_hub_agent


__all__ = [
    "onboarding_agent",
    "tutor_agent",
    "planner_agent",
    "analytics_agent",
    "student_hub_agent",
    "get_student_hub_agent",
]
