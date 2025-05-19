import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session # If you were using SQLAlchemy directly for test DB setup
from app.main import app # Your main FastAPI application instance
from app.db.supabase_client import get_supabase # To potentially mock or manage Supabase interactions
from app.config.settings import settings # If you need to override settings for tests
from typing import Generator, Any
import os

# Override Supabase settings for testing if necessary (e.g., point to a test Supabase project)
# For now, we'll assume tests run against your dev Supabase instance or a dedicated test instance.
# If you need to manage test data creation/cleanup, that logic would also often start here or in test-specific setup.

@pytest.fixture(scope="session")
def db_session() -> Generator[Any, None, None]:
    """
    Fixture to get a Supabase client instance.
    For many tests, directly using the get_supabase() imported might be fine
    if you are okay with hitting your actual dev Supabase instance.
    If you need to mock Supabase or manage test data, this fixture could be expanded.
    """
    # This is a simple version. For more complex scenarios, you might mock Supabase
    # or set up and tear down test data.
    supabase_client = get_supabase()
    yield supabase_client
    # No specific teardown for Supabase client here, as it's usually a shared client.
    # If you were creating/destroying tables or test-specific data, you'd do it here or per-test.

@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """
    Fixture to create a TestClient instance for making requests to the FastAPI app.
    The scope="module" means this client is created once per test module.
    """
    with TestClient(app) as c:
        yield c

# Example of how you might create a fixture for an authenticated user's token
# This is a basic example; you'll need to adapt it with actual test user credentials
# and potentially create these test users in your Supabase dev/test instance.

@pytest.fixture(scope="module")
def test_user_employee_token(client: TestClient) -> str:
    """
    Fixture to get an auth token for a regular employee test user.
    Assumes a test user 'testemployee' with password 'testpassword' exists or is created.
    """
    # You might want to ensure this user exists or create them via API if they don't.
    # For simplicity, this example assumes the user can be logged in.
    login_data = {"username": "testemployee", "password": "testpassword"}
    
    # Ensure the test employee exists or create one
    # This is a simplified creation attempt; in a real scenario, you might have
    # more robust setup/teardown or ensure users are pre-populated in a test DB.
    # Only attempt creation if login fails, or have a dedicated setup fixture.
    try:
        response = client.post("/token", data=login_data)
        if response.status_code != 200: # If login fails, try to create the user
            client.post("/employees/", json={
                "username": "testemployee",
                "password": "testpassword",
                "first_name": "Test",
                "last_name": "Employee",
                "job_title": "Tester",
                "department": "Testing",
                "email": "testemployee@example.com",
                "role": "employee"
            })
            response = client.post("/token", data=login_data) # Try login again
        
        response.raise_for_status() # Raise an exception for bad status codes
        return response.json()["access_token"]
    except Exception as e:
        pytest.fail(f"Failed to get/create test employee token: {e} - Ensure 'testemployee' can be created or logged in.")


@pytest.fixture(scope="module")
def test_user_hr_token(client: TestClient) -> str:
    """
    Fixture to get an auth token for an HR test user.
    Assumes a test user 'testhr' with password 'testpassword' and 'hr' role exists or is created.
    """
    login_data = {"username": "testhr", "password": "testpassword"}
    try:
        response = client.post("/token", data=login_data)
        if response.status_code != 200: # If login fails, try to create the user
            # IMPORTANT: Creating an HR user via the public API might be restricted.
            # This user might need to be pre-provisioned in your Supabase,
            # or created by another HR user if your API supports that flow and you test it.
            # For this fixture to work simply, 'testhr' might need to be manually created in Supabase
            # with the 'hr' role, or you need a more complex setup fixture.
            # The following is a placeholder and might fail due to role assignment restrictions.
            # A better way would be to have a superuser or a specific internal setup for test users.
            client.post("/employees/", json={ # This creation might need to be done by an already authenticated HR user
                "username": "testhr",
                "password": "testpassword",
                "first_name": "Test",
                "last_name": "HR",
                "job_title": "HR Tester",
                "department": "HR",
                "email": "testhr@example.com",
                "role": "hr" # This assignment needs to be permissible
            })
            # If the above creation requires an HR token itself, this becomes a chicken-and-egg.
            # In such cases, seed your test database with an HR user.
            response = client.post("/token", data=login_data)

        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        pytest.fail(f"Failed to get/create test HR token: {e} - Ensure 'testhr' (role: hr) can be created or logged in. This user might need to be pre-seeded in the database.")

# You can add more fixtures here as needed, e.g., for creating specific types of users,
# cleaning up test data, etc.