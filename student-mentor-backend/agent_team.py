"""Deprecated shim kept for backwards compatibility.

This module intentionally raises to prevent legacy imports from silently
working. Please import `student_hub_agent` from `agents.py` instead.
"""

raise ImportError(
    "agent_team module is deprecated. Import student_hub_agent from agents instead."
)
