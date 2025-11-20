"""Direct Firestore access layer - compatible interface with db_fire_proxy.py"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple

from google.cloud import firestore

from db import get_firestore_client, COLLECTIONS

FilterExpr = Tuple[str, str, Any]


class FirestoreProxyError(RuntimeError):
    """Raised when Firestore operations fail."""


@dataclass
class FirestoreDocument:
    """Lightweight representation of a Firestore document."""

    id: str
    data: Dict[str, Any]
    exists: bool = True


def _resolve_collection(name: str) -> str:
    return COLLECTIONS.get(name, name)


def get_document(collection: str, document_id: str) -> Optional[FirestoreDocument]:
    """Get a single document by ID."""
    client = get_firestore_client()
    doc_ref = client.collection(_resolve_collection(collection)).document(document_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    return FirestoreDocument(
        id=doc.id,
        data=doc.to_dict() or {},
        exists=True,
    )


def query_collection(
    collection: str,
    filters: Optional[Sequence[FilterExpr]] = None,
    limit: Optional[int] = None,
) -> List[FirestoreDocument]:
    """Query a collection with optional filters and limit."""
    client = get_firestore_client()
    query = client.collection(_resolve_collection(collection))
    
    if filters:
        for field, op, value in filters:
            query = query.where(field, op, value)
    
    if limit:
        query = query.limit(limit)
    
    results = []
    for doc in query.stream():
        results.append(
            FirestoreDocument(
                id=doc.id,
                data=doc.to_dict() or {},
                exists=True,
            )
        )
    
    return results


def upsert_document(
    collection: str,
    data: Dict[str, Any],
    *,
    document_id: Optional[str] = None,
    merge: bool = False,
    server_timestamp_fields: Optional[Sequence[str]] = None,
) -> FirestoreDocument:
    """Create or update a document."""
    client = get_firestore_client()
    col_ref = client.collection(_resolve_collection(collection))
    
    # Handle server timestamps
    if server_timestamp_fields:
        for field in server_timestamp_fields:
            data[field] = firestore.SERVER_TIMESTAMP
    
    if document_id:
        doc_ref = col_ref.document(document_id)
        if merge:
            doc_ref.set(data, merge=True)
        else:
            doc_ref.set(data)
        doc_id = document_id
    else:
        # Auto-generate ID
        doc_ref = col_ref.document()
        doc_ref.set(data)
        doc_id = doc_ref.id
    
    # Read back the document to get the actual data with timestamps
    doc = doc_ref.get()
    return FirestoreDocument(
        id=doc_id,
        data=doc.to_dict() or data,
        exists=True,
    )


def add_document(
    collection: str,
    data: Dict[str, Any],
    *,
    document_id: Optional[str] = None,
    server_timestamp_fields: Optional[Sequence[str]] = None,
) -> FirestoreDocument:
    """Add a new document."""
    return upsert_document(
        collection,
        data,
        document_id=document_id,
        merge=False,
        server_timestamp_fields=server_timestamp_fields,
    )


def delete_document(collection: str, document_id: str) -> None:
    """Delete a document by ID."""
    client = get_firestore_client()
    doc_ref = client.collection(_resolve_collection(collection)).document(document_id)
    doc_ref.delete()


def _utc_now() -> str:
    """Returns current UTC timestamp in ISO 8601 format."""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def update_document(
    collection: str,
    document_id: str,
    data: Dict[str, Any],
    server_timestamp_fields: Optional[Sequence[str]] = None,
) -> FirestoreDocument:
    """Update an existing document (merge=True)."""
    return upsert_document(
        collection,
        data,
        document_id=document_id,
        merge=True,
        server_timestamp_fields=server_timestamp_fields,
    )
