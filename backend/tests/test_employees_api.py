from fastapi.testclient import TestClient
from app.main import app # Assuming your main app instance
import pytest

# This client fixture would typically be in conftest.py
# @pytest.fixture(scope="module")
# def client():
#     with TestClient(app) as c:
#         yield c

def get_auth_token(client: TestClient, username: str, password: str) -> str:
    response = client.post("/token", data={"username": username, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]

# --- Test Create Employee ---
def test_create_employee_success(client: TestClient):
    response = client.post("/employees/", json={
        "username": "newtestuser_pytest",
        "password": "strongpassword123",
        "first_name": "New",
        "last_name": "User",
        "job_title": "Pytest Tester",
        "department": "Testing",
        "email": "newpytest@example.com",
        "role": "employee" # Explicitly setting, or test default
    })
    assert response.status_code == 201 # Assuming you set 201 for creation
    data = response.json()
    assert data["email"] == "newpytest@example.com"
    assert "id" in data
    # Add more assertions based on your EmployeeResponse model

def test_create_employee_username_exists(client: TestClient):
    # First, create a user
    client.post("/employees/", json={
        "username": "existinguser_pytest",
        "password": "password123",
        "first_name": "Existing", "last_name": "Py", "job_title": "Dev",
        "department": "Code", "email": "existing@example.com"
    })
    # Then, try to create another with the same username
    response = client.post("/employees/", json={
        "username": "existinguser_pytest", # Same username
        "password": "password456",
        "first_name": "Another", "last_name": "User", "job_title": "Dev",
        "department": "Code", "email": "another@example.com"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"

# --- Test Get My Profile ---
def test_get_my_profile_authenticated(client: TestClient):
    # Assume you have a way to create a test user and get a token
    # For simplicity, let's say a test user 'auth_user' with 'password' exists
    # You'd ideally create this user via the API in a setup step or fixture
    client.post("/employees/", json={ # Ensure user exists for login
        "username": "getme_user", "password": "getme_password",
        "first_name": "GetMe", "last_name": "Test", "job_title": "Profile Viewer",
        "department": "Self", "email": "getme@example.com"
    })
    token = get_auth_token(client, "getme_user", "getme_password")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/employees/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "getme@example.com" # Or check username if you add it to EmployeeResponse

def test_get_my_profile_unauthenticated(client: TestClient):
    response = client.get("/employees/me")
    assert response.status_code == 401

# ... more tests for other endpoints ...