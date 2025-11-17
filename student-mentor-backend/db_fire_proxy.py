from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import requests

DEFAULT_TIMEOUT = float(os.getenv("FIRESTORE_PROXY_TIMEOUT", "10"))
_FIRESTORE_SERVICE_URL = os.getenv("FIRESTORE_SERVICE_URL", "http://localhost:8001").rstrip("/")

COLLECTIONS: Dict[str, str] = {
    "users": "users",
    "studentProfiles": "studentProfiles",
    "teacherProfiles": "teacherProfiles",
    "assignments": "assignments",
    "studentSubmissions": "studentSubmissions",
    "checkins": "checkins",
    "attendance": "attendance",
    "timetables": "timetables",
}

FilterExpr = Tuple[str, str, Any]


class FirestoreProxyError(RuntimeError):
    """Raised when Firestore proxy communication fails."""


@dataclass
class FirestoreDocument:
    """Lightweight representation of a Firestore document."""

    id: str
    data: Dict[str, Any]
    exists: bool = True


def _resolve_collection(name: str) -> str:
    return COLLECTIONS.get(name, name)


def _url(path: str) -> str:
    if not path.startswith("/"):
        path = "/" + path
    return f"{_FIRESTORE_SERVICE_URL}{path}"


def _post(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = _url(path)
    try:
        response = requests.post(url, json=payload, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:  # pragma: no cover - network failures
        raise FirestoreProxyError(f"Firestore proxy request failed: {exc}") from exc

    data = response.json()
    if not isinstance(data, dict):  # pragma: no cover - defensive guard
        raise FirestoreProxyError("Firestore proxy returned unexpected payload")
    return data


def _doc_from_payload(payload: Dict[str, Any]) -> FirestoreDocument:
    return FirestoreDocument(
        id=str(payload.get("id")),
        data=payload.get("data") or {},
        exists=payload.get("exists", True),
    )


def get_document(collection: str, document_id: str) -> Optional[FirestoreDocument]:
    response = _post(
        "/get",
        {
            "collection": _resolve_collection(collection),
            "documentId": document_id,
        },
    )
    documents = response.get("documents", [])
    if not documents:
        return None
    doc = _doc_from_payload(documents[0])
    return doc if doc.exists else None


def query_collection(
    collection: str,
    filters: Optional[Sequence[FilterExpr]] = None,
    limit: Optional[int] = None,
) -> List[FirestoreDocument]:
    payload: Dict[str, Any] = {"collection": _resolve_collection(collection)}
    if filters:
        payload["filters"] = [
            {"field": field, "op": op, "value": value}
            for field, op, value in filters
        ]
    if limit:
        payload["limit"] = limit

    response = _post("/get", payload)
    documents = response.get("documents", [])
    return [_doc_from_payload(doc) for doc in documents if doc.get("exists", True)]


def upsert_document(
    collection: str,
    data: Dict[str, Any],
    *,
    document_id: Optional[str] = None,
    merge: bool = False,
    server_timestamp_fields: Optional[Iterable[str]] = None,
) -> FirestoreDocument:
    payload: Dict[str, Any] = {
        "collection": _resolve_collection(collection),
        "data": data,
        "merge": merge,
    }
    if document_id:
        payload["documentId"] = document_id
    if server_timestamp_fields:
        payload["serverTimestampFields"] = list(server_timestamp_fields)

    response = _post("/upsert", payload)
    return FirestoreDocument(
        id=str(response.get("id")),
        data=response.get("data") or {},
        exists=True,
    )


def add_document(
    collection: str,
    data: Dict[str, Any],
    *,
    document_id: Optional[str] = None,
    server_timestamp_fields: Optional[Iterable[str]] = None,
) -> FirestoreDocument:
    return upsert_document(
        collection,
        data,
        document_id=document_id,
        merge=False,
        server_timestamp_fields=server_timestamp_fields,
    )
