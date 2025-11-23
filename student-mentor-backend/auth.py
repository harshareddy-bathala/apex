"""Firebase authentication helpers for FastAPI endpoints."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from models import User

_auth_app = None
_security_scheme = HTTPBearer(auto_error=False)


def _initialize_firebase_app() -> firebase_admin.App:
    global _auth_app
    if _auth_app:
        return _auth_app

    try:
        # Priority 1: Explicit file path from environment variable
        credentials_path = os.getenv("FIREBASE_CREDENTIALS_FILE") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        # Priority 2: Check for firestore.json in the current directory (common location)
        if not credentials_path:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            default_path = os.path.join(script_dir, "firestore.json")
            if os.path.exists(default_path):
                credentials_path = default_path
                print(f"📁 Found firestore.json in backend directory, using it automatically")
        
        if credentials_path:
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"Firebase credentials file not found: {credentials_path}")
            cred = credentials.Certificate(credentials_path)
            print(f"✅ Using Firebase credentials from: {credentials_path}")
        # Priority 3: Application Default Credentials (fallback)
        else:
            print("⚠️  No FIREBASE_CREDENTIALS_FILE, GOOGLE_APPLICATION_CREDENTIALS, or firestore.json found, using Application Default Credentials")
            cred = credentials.ApplicationDefault()

        _auth_app = firebase_admin.initialize_app(cred)
        print(f"✅ Firebase Admin SDK initialized successfully (Project: {_auth_app.project_id})")
        return _auth_app
    except Exception as e:
        print(f"❌ Failed to initialize Firebase Admin SDK: {type(e).__name__}: {e}")
        raise


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
        # Log the actual error for debugging
        error_type = type(exc).__name__
        error_msg = str(exc)
        print(f"❌ Token verification failed: {error_type} - {error_msg}")
        print(f"   Token preview: {token[:50]}..." if token and len(token) > 50 else f"   Token: {token}")
        # Include more details in development, but keep it secure in production
        detail_msg = f"Invalid or expired ID token: {error_type}"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail_msg) from exc

    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing uid claim")

    # Query MongoDB for the user using Beanie ODM
    user = await User.find_one(User.id == uid)
    
    # Auto-Heal / Lazy Creation: If user doesn't exist, create a new one
    if user is None:
        email = decoded.get("email") or ""
        user = User(
            id=uid,
            email=email,
            role="student",
        )
        await user.insert()
        print(f"✅ Auto-created user document for {email} (UID: {uid})")

    role = user.role
    if role not in ("student", "teacher"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role missing or unsupported")

    email = user.email or decoded.get("email") or ""

    return FirebaseUser(uid=uid, email=email, role=role, claims=decoded)
