from __future__ import annotations

import os
from typing import Any, Callable, Dict, Optional, Sequence

# Try to import google-adk agents, fallback to mock implementations
try:
    from google.adk.agents import Agent, ParallelAgent, SequentialAgent
except ImportError:
    # Fallback mock implementations for development/testing
    class Agent:
        def __init__(self, name: str, instruction: str, model: str, tools: Optional[list] = None):
            self.name = name
            self.instruction = instruction
            self.model = model
            self.tools = tools or []

        def run(self, message: str, session: Optional[Any] = None) -> str:
            # Mock implementation - return a simple response
            return f"Mock response from {self.name}: {message[:50]}..."

    class ParallelAgent(Agent):
        pass

    class SequentialAgent(Agent):
        pass

from memory import memory_bank, session_service
from tools import (
    analyze_checkin_insights,
    create_assignment,
    generate_teacher_report,
    get_assignments_for_student,
    get_student_habits,
    get_student_profile,
    record_daily_checkin,
    record_habit_checkin,
    register_analytics_runner as _register_analytics_callback,
    save_student_profile_data,
    update_student_goals,
    get_upcoming_assignments,
    get_community_posts,
    get_resources,
)

def make_llm_agent(
    *,
    name: str,
    instruction: str,
    tools: Sequence[Callable[..., str]] | None = None,
    memory_enabled: bool = False,
) -> Agent:
    """Create consistent LLM agents without repeating boilerplate.
    
    Note: memory_enabled parameter is kept for backward compatibility but is not used
    in Agent construction. Memory is handled via sessions when calling agent.run().
    """

    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    tool_list = list(tools) if tools else []

    # google-adk 0.3.0 Agent expects 'instruction' (singular), not 'instructions'
    # Memory is not a constructor parameter; it's managed via sessions in agent.run()
    agent_kwargs = {
        "name": name,
        "instruction": instruction,  # Changed from 'instructions' to 'instruction'
        "model": model_name,
        "tools": tool_list,
    }

    return Agent(**agent_kwargs)


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
        "retrieve assignments, search community discussions, surface shared resources, and log reflections."
    ),
    tools=[
        get_assignments_for_student,
        get_upcoming_assignments,
        get_community_posts,
        get_resources,
        record_daily_checkin,
        get_student_habits,
        record_habit_checkin,
        generate_teacher_report,
    ],
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
        "Quietly analyze longitudinal submissions, check-ins, and attendance to detect emerging patterns "
        "such as multi-day mood drops or repeated missed work. Only output concise summaries or structured insights."
    ),
    memory_enabled=True,
)

checkin_analyst_agent = make_llm_agent(
    name="checkin_analyst_agent",
    instruction=(
        "You are a compassionate and insightful check-in analyst. Analyze daily check-in data including mood, "
        "sleep, study hours, achievements, mistakes, and future plans. Provide personalized insights, "
        "encouragement, and actionable recommendations. Focus on patterns, growth opportunities, and "
        "positive reinforcement while being honest about areas needing improvement."
    ),
    tools=[analyze_checkin_insights, get_student_profile],
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
