"""Firebase authentication helpers for FastAPI endpoints."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from db_direct import get_document

_auth_app = None
_security_scheme = HTTPBearer(auto_error=False)


def _initialize_firebase_app() -> firebase_admin.App:
    global _auth_app
    if _auth_app:
        return _auth_app

    credentials_path = os.getenv("FIREBASE_CREDENTIALS_FILE") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if credentials_path:
        cred = credentials.Certificate(credentials_path)
    else:
        cred = credentials.ApplicationDefault()

    _auth_app = firebase_admin.initialize_app(cred)
    return _auth_app


_initialize_firebase_app()


@dataclass
class FirebaseUser:
    uid: str
    email: str
    role: str
    claims: Dict[str, Any]


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_security_scheme),
) -> FirebaseUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token, app=firebase_admin.get_app())
    except Exception as exc:  # firebase_admin raises multiple subclasses
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired ID token") from exc

    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing uid claim")

    user_snapshot = get_document("users", uid)
    if not user_snapshot:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User record not provisioned")

    user_data = user_snapshot.data or {}
    role = user_data.get("role")
    if role not in ("student", "teacher"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role missing or unsupported")

    email = user_data.get("email") or decoded.get("email") or ""

    return FirebaseUser(uid=uid, email=email, role=role, claims=decoded)
