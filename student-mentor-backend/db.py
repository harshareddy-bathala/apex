import os
from functools import lru_cache
from typing import Dict

from google.cloud import firestore

FIRESTORE_PROJECT_ID = os.getenv("FIRESTORE_PROJECT_ID")

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


@lru_cache
def get_firestore_client() -> firestore.Client:
    """Return a cached Firestore client, raising if env misconfigured."""
    if not FIRESTORE_PROJECT_ID:
        raise RuntimeError("FIRESTORE_PROJECT_ID env var is required for Firestore access")
    return firestore.Client(project=FIRESTORE_PROJECT_ID, database="student-mentor-db")


def collection_ref(key: str) -> firestore.CollectionReference:
    return get_firestore_client().collection(COLLECTIONS[key])


def user_doc(user_id: str) -> firestore.DocumentReference:
    return get_firestore_client().collection(COLLECTIONS["users"]).document(user_id)


def student_profile_doc(student_id: str) -> firestore.DocumentReference:
    return get_firestore_client().collection(COLLECTIONS["studentProfiles"]).document(student_id)


def teacher_profile_doc(teacher_id: str) -> firestore.DocumentReference:
    return get_firestore_client().collection(COLLECTIONS["teacherProfiles"]).document(teacher_id)


def assignment_doc(assignment_id: str) -> firestore.DocumentReference:
    return get_firestore_client().collection(COLLECTIONS["assignments"]).document(assignment_id)


def timetable_doc(class_id: str) -> firestore.DocumentReference:
    return get_firestore_client().collection(COLLECTIONS["timetables"]).document(class_id)
