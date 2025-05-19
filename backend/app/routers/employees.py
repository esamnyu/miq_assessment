from fastapi import APIRouter, Depends, HTTPException, status, Body # Added Body
from typing import List, Optional, Union # Added Union
from app.models.employee import (
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeConfidential,
    # Consider adding an AdminEmployeeUpdate if it differs significantly from EmployeeUpdate
    # For now, we can try to reuse EmployeeUpdate or be careful with what HR can update.
)
from app.auth.auth import get_current_user, get_password_hash # Removed create_access_token, not used here
from app.db.supabase_client import get_supabase
import uuid

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee: EmployeeCreate,
    # If HR is the one creating users and setting roles, they must be authenticated
    current_user_for_role_assignment: Optional[dict] = Depends(get_current_user) # Made optional for self-registration scenario
):
    supabase = get_supabase()

    # Check if username exists
    # Using count='exact' is generally more efficient if supported well by your client version.
    # If not, selecting a minimal field and checking if data exists is also good.
    existing_user_check = supabase.table("employees").select("id", count='exact').eq("username", employee.username).execute()
    if existing_user_check.count > 0: # Access count attribute
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    # Role assignment logic
    assigned_role = employee.role
    if employee.role in ["hr", "manager"]:
        if not current_user_for_role_assignment or current_user_for_role_assignment.get("role") not in ["hr", "admin"]: # Assuming 'admin' could also do this
            # If not an HR/admin trying to assign privileged role, or if it's self-registration trying this,
            # either forbid or default to "employee". Forbidding is safer.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to assign privileged roles."
            )
    elif not current_user_for_role_assignment: # Self-registration scenario
        assigned_role = "employee" # Enforce default role for self-registration
    # If an authenticated user (non-HR) is creating another user (if that's a feature),
    # they should also only be able to assign 'employee' role.
    # The default in EmployeeCreate is 'employee', so if role isn't in ["hr", "manager"], it's fine.


    # Create employee with hashed password
    employee_data = employee.model_dump() # Use model_dump() for Pydantic v2
    password = employee_data.pop("password")
    employee_data["password_hash"] = get_password_hash(password)
    employee_data["id"] = str(uuid.uuid4())
    employee_data["role"] = assigned_role # Ensure the determined role is used

    # Insert into Supabase
    result = supabase.table("employees").insert(employee_data).execute()

    # Check for errors from Supabase insert
    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create employee: {result.error.message}")
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create employee, no data returned.")

    return result.data[0]

@router.get("/me", response_model=EmployeeResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    # current_user from get_current_user is the raw dict from Supabase.
    # FastAPI will automatically validate and parse it against EmployeeResponse.
    # If EmployeeResponse is missing fields present in current_user (like 'username', 'password_hash'),
    # they will be excluded, which is good for 'password_hash'.
    # If 'username' should be in EmployeeResponse, add it to the Pydantic model.
    return current_user

@router.put("/me", response_model=EmployeeResponse)
async def update_my_profile(
    employee_update: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()

    # Pydantic v2: .model_dump(exclude_unset=True)
    update_data = employee_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    result = supabase.table("employees").update(update_data).eq("id", current_user["id"]).select("*").execute() # Added select("*")

    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update employee: {result.error.message}")
    if not result.data:
        # This could also mean the user ID didn't match, though less likely for /me
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or update failed")

    return result.data[0]

# New endpoint for HR to edit non-confidential info of ANY employee
@router.put("/admin/{employee_id_to_update}", response_model=EmployeeResponse, tags=["admin"]) # Added new tag
async def admin_update_employee_profile(
    employee_id_to_update: str,
    employee_update_data: EmployeeUpdate, # Reusing EmployeeUpdate, be mindful of fields
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["hr", "manager", "admin"]: # Or just "hr" if managers shouldn't do this
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this action")

    supabase = get_supabase()
    update_payload = employee_update_data.model_dump(exclude_unset=True)

    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    # Prevent HR from updating certain fields they shouldn't, e.g., username or role via this endpoint
    # Password is not in EmployeeUpdate, so that's good.
    # Role is not in EmployeeUpdate by default, if it were, you'd protect it.
    # Example:
    # if "username" in update_payload:
    #     del update_payload["username"]
    # if "role" in update_payload: # If EmployeeUpdate could somehow contain role
    #     del update_payload["role"]


    result = supabase.table("employees").update(update_payload).eq("id", employee_id_to_update).select("*").execute() # Added select("*")

    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update employee: {result.error.message}")
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee with id {employee_id_to_update} not found or update failed")

    return result.data[0]


@router.put("/{employee_id}/salary", response_model=EmployeeConfidential, tags=["admin"]) # Added admin tag
async def update_salary(
    employee_id: str,
    # To receive salary as a raw float in the body, not as a query parameter:
    salary_payload: float = Body(..., embed=True, alias="salary"), # Use Body for request body field
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["hr", "manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    supabase = get_supabase()
    # Ensure the update payload is structured as Supabase expects, e.g., {"salary": salary_payload}
    result = supabase.table("employees").update({"salary": salary_payload}).eq("id", employee_id).select("*").execute() # Added select("*")

    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update salary: {result.error.message}")
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or salary update failed")

    return result.data[0]

@router.get("/api/employee", response_model=Union[EmployeeResponse, List[EmployeeResponse]]) # Can return a list if name is ambiguous
async def get_employee_by_id_or_name(
    employee_id: Optional[str] = None,
    name: Optional[str] = None
    # Consider adding current_user: dict = Depends(get_current_user) if this needs to be protected
):
    if not employee_id and not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either employee_id or name must be provided")

    supabase = get_supabase()
    query = supabase.table("employees").select(
        "id, first_name, last_name, job_title, department, email, phone, role, created_at" # Explicitly list non-confidential fields
    ) # Exclude password_hash and salary by default

    if employee_id:
        query = query.eq("id", employee_id)
    elif name:
        parts = name.split()
        # Using ilike for case-insensitive search - adjust if your Supabase client syntax differs
        # Ensure your PostgreSQL columns have appropriate indexing for ilike if performance is critical
        if len(parts) > 1:
            first_name_pattern = f"%{parts[0]}%"
            last_name_pattern = f"%{' '.join(parts[1:])}%"
            # This is an AND condition, both must match (fuzzy match)
            query = query.ilike("first_name", first_name_pattern).ilike("last_name", last_name_pattern)
        else:
            name_pattern = f"%{name}%"
            # This is an OR condition, fuzzy match on either
            query = query.or_(f"first_name.ilike.{name_pattern},last_name.ilike.{name_pattern}")

    result = query.execute()

    if hasattr(result, 'error') and result.error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching employee: {result.error.message}")

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # If searching by name could return multiple results, and you want to return all:
    if name and not employee_id and len(result.data) > 1:
        return result.data # Returns a list of EmployeeResponse

    return result.data[0] # Returns a single EmployeeResponse