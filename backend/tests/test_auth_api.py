import pytest
from fastapi.testclient import TestClient
from fastapi import status # For status codes

# Assuming your conftest.py provides the 'client' fixture
# and potentially helper fixtures to create users.

# For these tests, we'll need at least one user to exist in the database.
# Ideally, you'd have a fixture in conftest.py or a setup function here
# to ensure a specific test user exists before these tests run.
# For simplicity now, we'll often create the user directly within the test
# or assume the 'test_user_employee_token' and 'test_user_hr_token' fixtures
# in conftest.py handle user creation/existence if login fails initially.

TEST_USERNAME = "testloginuser"
TEST_PASSWORD = "testloginpassword"

@pytest.fixture(scope="module", autouse=True)
def create_test_login_user(client: TestClient):
    """
    Fixture to ensure the primary test user for login tests exists.
    This will run once per module before any tests in this file.
    """
    response = client.post(
        "/employees/",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "first_name": "Test",
            "last_name": "LoginUser",
            "job_title": "Loginner",
            "department": "AuthDept",
            "email": "testlogin@example.com",
            "role": "employee",
        },
    )
    # We don't strictly need to assert success here if the user might already exist
    # from a previous run, but it's good for initial setup.
    # If user already exists (400), that's okay for this fixture's purpose.
    # A more robust fixture might check first or use a unique user for each test run if needed.
    # For now, this ensures the user is there for login attempts.
    if response.status_code not in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]:
        pytest.fail(f"Failed to ensure test login user '{TEST_USERNAME}' exists or was created. Status: {response.status_code}, Detail: {response.text}")


def test_login_for_access_token_success(client: TestClient):
    """Test successful login and token generation."""
    login_data = {"username": TEST_USERNAME, "password": TEST_PASSWORD}
    response = client.post("/token", data=login_data)

    assert response.status_code == status.HTTP_200_OK
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    # You could add more assertions here, like trying to decode the token
    # if you have your JWT_SECRET available and want to verify its contents (e.g., 'sub' claim)

def test_login_incorrect_password(client: TestClient):
    """Test login attempt with an incorrect password."""
    login_data = {"username": TEST_USERNAME, "password": "wrongpassword"}
    response = client.post("/token", data=login_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    response_data = response.json()
    assert response_data["detail"] == "Incorrect username or password"
    assert "WWW-Authenticate" in response.headers
    assert response.headers["WWW-Authenticate"] == "Bearer"

def test_login_non_existent_user(client: TestClient):
    """Test login attempt with a username that does not exist."""
    login_data = {"username": "nonexistentuser", "password": "anypassword"}
    response = client.post("/token", data=login_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    response_data = response.json()
    assert response_data["detail"] == "Incorrect username or password"
    # Supabase might return an empty list, leading to user being None,
    # which then triggers the same detail message as an incorrect password. This is acceptable.

def test_login_missing_username(client: TestClient):
    """Test login attempt with missing username in form data."""
    # FastAPI's OAuth2PasswordRequestForm handles this validation before your endpoint logic.
    # It will return a 422 Unprocessable Entity if form fields are missing.
    login_data = {"password": TEST_PASSWORD} # Missing username
    response = client.post("/token", data=login_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert "detail" in response_data
    # Check that the detail message indicates username is required
    # The exact message might vary slightly based on FastAPI version.
    # Example check (might need adjustment):
    found_username_error = False
    for error in response_data.get("detail", []):
        if "username" in error.get("loc", []) and "Missing" in error.get("msg", ""): # Pydantic v2 style
             found_username_error = True
             break
        elif "username" in error.get("loc", []) and "field required" in error.get("msg", ""): # Pydantic v1 style
            found_username_error = True
            break
    assert found_username_error, "Error detail for missing username not found or not as expected"


def test_login_missing_password(client: TestClient):
    """Test login attempt with missing password in form data."""
    login_data = {"username": TEST_USERNAME} # Missing password
    response = client.post("/token", data=login_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert "detail" in response_data
    # Check that the detail message indicates password is required
    found_password_error = False
    for error in response_data.get("detail", []):
        if "password" in error.get("loc", []) and "Missing" in error.get("msg", ""): # Pydantic v2 style
             found_password_error = True
             break
        elif "password" in error.get("loc", []) and "field required" in error.get("msg", ""): # Pydantic v1 style
            found_password_error = True
            break
    assert found_password_error, "Error detail for missing password not found or not as expected"

def test_login_empty_username(client: TestClient):
    """Test login attempt with empty username."""
    login_data = {"username": "", "password": TEST_PASSWORD}
    response = client.post("/token", data=login_data)
    # FastAPI's OAuth2PasswordRequestForm might still consider "" as "provided but empty".
    # This will likely lead to your endpoint logic treating it as an incorrect username.
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect username or password"


def test_login_empty_password(client: TestClient):
    """Test login attempt with empty password."""
    login_data = {"username": TEST_USERNAME, "password": ""}
    response = client.post("/token", data=login_data)
    # Similar to empty username, this will likely be treated as an incorrect password by your logic.
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect username or password"