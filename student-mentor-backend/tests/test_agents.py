"""Offline-safe smoke tests for the agent wiring."""

from __future__ import annotations

import os

import pytest

os.environ.setdefault("GOOGLE_API_KEY", "test-key-not-used")

RUN_MODEL_FACTORY_TESTS = os.getenv("RUN_MODEL_FACTORY_TESTS", "0") == "1"


def test_student_hub_agent_is_importable() -> None:
    """Ensure importing the student hub succeeds without remote calls."""

    from agents import get_student_hub_agent

    hub = get_student_hub_agent()
    assert hub is not None


@pytest.mark.skipif(not RUN_MODEL_FACTORY_TESTS, reason="Model factory checks disabled for offline CI")
def test_model_factory_can_instantiate_or_stub() -> None:
    """Optional check that _make_model returns an object when enabled."""

    from agents import _make_model

    model = _make_model()
    assert model is not None
