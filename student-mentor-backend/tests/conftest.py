# tests/conftest.py
# Ensure project root is on sys.path so tests can import top-level modules like `agents`.
import sys, pathlib

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
