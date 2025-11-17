"""Utility script to mint a Firebase ID token for local testing."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

import firebase_admin
from firebase_admin import auth, credentials

IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken"


def _ensure_firebase_app(project_id: str | None) -> None:
    if firebase_admin._apps:  # type: ignore[attr-defined]
        return

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path:
        cred = credentials.Certificate(cred_path)
    else:
        cred = credentials.ApplicationDefault()
    options = {"projectId": project_id} if project_id else None
    firebase_admin.initialize_app(cred, options)


def _create_custom_token(uid: str, project_id: str | None) -> str:
    _ensure_firebase_app(project_id)
    token_bytes = auth.create_custom_token(uid)
    return token_bytes.decode("utf-8")


def _exchange_for_id_token(api_key: str, custom_token: str) -> str:
    payload = json.dumps({"token": custom_token, "returnSecureToken": True}).encode("utf-8")
    url = f"{IDENTITY_TOOLKIT_URL}?key={api_key}"
    request = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise SystemExit(f"Identity Toolkit request failed: {exc.status} {exc.reason} -> {details}") from exc

    id_token = data.get("idToken")
    if not id_token:
        raise SystemExit("Identity Toolkit response missing idToken")
    return id_token


def main() -> None:
    parser = argparse.ArgumentParser(description="Mint a Firebase ID token for an existing user")
    parser.add_argument("--uid", required=True, help="Firebase Auth UID to impersonate")
    parser.add_argument(
        "--api-key",
        default=os.getenv("FIREBASE_WEB_API_KEY"),
        help="Firebase Web API key; defaults to FIREBASE_WEB_API_KEY env var",
    )
    parser.add_argument(
        "--project-id",
        default=os.getenv("FIREBASE_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT"),
        help="Firebase project ID; defaults to FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT env vars",
    )
    args = parser.parse_args()

    if not args.api_key:
        raise SystemExit("--api-key argument or FIREBASE_WEB_API_KEY environment variable is required")

    custom_token = _create_custom_token(args.uid, args.project_id)
    id_token = _exchange_for_id_token(args.api_key, custom_token)
    print(id_token)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
