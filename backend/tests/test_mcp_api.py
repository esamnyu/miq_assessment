import pytest
from fastapi.testclient import TestClient

def test_mcp_get_employee(client: TestClient, test_user_hr_token: str):
    """Test getting an employee through the MCP endpoint."""
    # First, create an employee for testing
    employee_data = {
        "username": "mcptestuser",
        "password": "Password123!",
        "first_name": "MCP",
        "last_name": "Test",
        "job_title": "Test Job",
        "department": "Testing",
        "email": "mcptest@example.com"
    }
    response = client.post(
        "/employees/",
        json=employee_data,
        headers={"Authorization": f"Bearer {test_user_hr_token}"}
    )
    assert response.status_code == 201
    employee_id = response.json()["id"]
    
    # Test the MCP endpoint
    mcp_request = {
        "action": "get_employee",
        "parameters": {"employee_id": employee_id},
        "context": {
            "service": "test-client",
            "timestamp": "2025-05-20T12:00:00Z"
        }
    }
    
    response = client.post(
        "/employees/api/mcp",
        json=mcp_request,
        headers={"Authorization": f"Bearer {test_user_hr_token}"}
    )
    
    assert response.status_code == 200
    mcp_response = response.json()
    assert mcp_response["status"] == "success"
    assert mcp_response["data"]["id"] == employee_id
    assert mcp_response["data"]["first_name"] == "MCP"
    assert "context" in mcp_response