from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from auth import FirebaseUser

client = TestClient(app)

# Mock User
MOCK_TEACHER = FirebaseUser(uid="teacher123", email="teacher@school.com", role="teacher")
MOCK_STUDENT = FirebaseUser(uid="student123", email="student@school.com", role="student")

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("main.verify_firebase_token")
@patch("main.upsert_document")
@patch("main.get_document")
def test_create_user_doc(mock_get, mock_upsert, mock_auth):
    # This endpoint is public in our impl (or protected by other means), 
    # but let's test the logic.
    mock_get.return_value = None # User doesn't exist
    
    payload = {"uid": "newuser", "email": "new@test.com"}
    response = client.post("/auth/create-user-doc", json=payload)
    
    assert response.status_code == 200
    assert response.json()["uid"] == "newuser"
    assert response.json()["role"] == "student"
    mock_upsert.assert_called_once()

@patch("main.verify_firebase_token")
@patch("main.add_document")
def test_create_assignment(mock_add, mock_auth):
    mock_auth.return_value = MOCK_TEACHER
    
    payload = {
        "title": "Math Test",
        "classId": "10A",
        "type": "test",
        "dueDate": "2023-12-01"
    }
    
    response = client.post("/assignment", json=payload, headers={"Authorization": "Bearer token"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Math Test"
    assert data["teacherId"] == "teacher123"
    assert data["status"] == "active"
    mock_add.assert_called_once()

@patch("main.verify_firebase_token")
@patch("main.add_document")
def test_create_assignment_student_fail(mock_add, mock_auth):
    mock_auth.return_value = MOCK_STUDENT
    
    payload = {
        "title": "Hacker Test",
        "classId": "10A"
    }
    
    response = client.post("/assignment", json=payload, headers={"Authorization": "Bearer token"})
    
    assert response.status_code == 403

@patch("main.verify_firebase_token")
@patch("main.delete_document")
def test_delete_assignment(mock_delete, mock_auth):
    mock_auth.return_value = MOCK_TEACHER
    
    response = client.delete("/assignment/assign123", headers={"Authorization": "Bearer token"})
    
    assert response.status_code == 200
    mock_delete.assert_called_with("assignments", "assign123")

@patch("main.verify_firebase_token")
@patch("main.query_collection")
@patch("main.get_document")
def test_get_peers_search(mock_get_doc, mock_query, mock_auth):
    mock_auth.return_value = MOCK_STUDENT
    
    # Mock users query
    mock_query.return_value = [
        MagicMock(data={"uid": "peer1", "email": "peer1@test.com"}),
        MagicMock(data={"uid": "peer2", "email": "peer2@test.com"})
    ]
    
    # Mock profile get
    def get_profile_side_effect(collection, uid):
        if uid == "peer1":
            return {"name": "Alice Smith"}
        if uid == "peer2":
            return {"name": "Bob Jones"}
        return {}
    mock_get_doc.side_effect = get_profile_side_effect
    
    # Test search "Alice"
    response = client.get("/peers?search=Alice", headers={"Authorization": "Bearer token"})
    assert response.status_code == 200
    peers = response.json()["peers"]
    assert len(peers) == 1
    assert peers[0]["name"] == "Alice Smith"
    
    # Test search "Bob"
    response = client.get("/peers?search=Bob", headers={"Authorization": "Bearer token"})
    assert response.status_code == 200
    peers = response.json()["peers"]
    assert len(peers) == 1
    assert peers[0]["name"] == "Bob Jones"

@patch("main.verify_firebase_token")
@patch("main.query_collection")
def test_get_tests_filtering(mock_query, mock_auth):
    mock_auth.return_value = MOCK_TEACHER
    
    client.get("/tests", headers={"Authorization": "Bearer token"})
    
    # Verify filters passed to query_collection
    call_args = mock_query.call_args
    filters = call_args[1]["filters"] # kwargs['filters']
    
    # Should filter by type='test' and teacherId='teacher123'
    assert ("type", "==", "test") in filters
    assert ("teacherId", "==", "teacher123") in filters
