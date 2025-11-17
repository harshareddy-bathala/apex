from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from google.cloud import firestore

app = FastAPI(title="Student Mentor Firestore Proxy", version="1.0.0")

FIRESTORE_PROJECT_ID = os.getenv("FIRESTORE_PROJECT_ID")
if not FIRESTORE_PROJECT_ID:
    raise RuntimeError("FIRESTORE_PROJECT_ID environment variable is required")

firestore_client = firestore.Client(project=FIRESTORE_PROJECT_ID)


class Filter(BaseModel):
    field: str
    op: str = Field(pattern=r"^(==)$")
    value: Any


class GetRequest(BaseModel):
    collection: str
    document_id: Optional[str] = Field(default=None, alias="documentId")
    filters: Optional[List[Filter]] = None
    limit: Optional[int] = None


class UpsertRequest(BaseModel):
    collection: str
    document_id: Optional[str] = Field(default=None, alias="documentId")
    data: Dict[str, Any]
    merge: bool = False
    server_timestamp_fields: List[str] = Field(default_factory=list, alias="serverTimestampFields")


def _apply_server_timestamps(payload: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
    if not fields:
        return payload

    def _set_value(obj: Dict[str, Any], path: List[str]) -> None:
        cursor = obj
        for key in path[:-1]:
            next_val = cursor.get(key)
            if not isinstance(next_val, dict):
                next_val = {}
            cursor[key] = next_val
            cursor = next_val
        cursor[path[-1]] = firestore.SERVER_TIMESTAMP

    for field in fields:
        if not field:
            continue
        _set_value(payload, field.split("."))
    return payload


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/get")
def get_documents(request: GetRequest) -> Dict[str, Any]:
    collection = firestore_client.collection(request.collection)

    if request.document_id:
        snapshot = collection.document(request.document_id).get()
        return {
            "documents": [
                {
                    "id": snapshot.id,
                    "exists": snapshot.exists,
                    "data": snapshot.to_dict() if snapshot.exists else None,
                }
            ]
        }

    query = collection
    for filt in request.filters or []:
        query = query.where(filt.field, filt.op, filt.value)
    if request.limit:
        query = query.limit(request.limit)

    documents = [
        {
            "id": snapshot.id,
            "exists": snapshot.exists,
            "data": snapshot.to_dict() if snapshot.exists else None,
        }
        for snapshot in query.stream()
    ]
    return {"documents": documents}


@app.post("/upsert")
def upsert_document(request: UpsertRequest) -> Dict[str, Any]:
    collection = firestore_client.collection(request.collection)
    doc_ref = collection.document(request.document_id) if request.document_id else collection.document()

    payload = _apply_server_timestamps(dict(request.data), request.server_timestamp_fields)
    doc_ref.set(payload, merge=request.merge)
    stored = doc_ref.get()
    if not stored.exists:
        raise HTTPException(status_code=500, detail="Document write failed")

    return {
        "id": doc_ref.id,
        "data": stored.to_dict() or {},
    }
