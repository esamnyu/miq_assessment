from fastapi import APIRouter, Depends, HTTPException, status, Body, Request, Header
from typing import List, Optional, Union
from app.models.employee import (
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeConfidential,
)
from app.auth.auth import get_current_user, get_password_hash, oauth2_scheme
from app.db.supabase_client import get_supabase
import uuid
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees", tags=["employees"])

# This is the key fix - make token truly optional by not depending directly on oauth2_scheme
async def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Truly optional authentication that doesn't raise 401 when no token is provided.
    """
    if not authorization:
        logger.info("No Authorization header found, proceeding as unauthenticated")
        return None
    
    try:
        # Extract token from Bearer format
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            logger.info(f"Found Bearer token, attempting to validate")
            user = await get_current_user(token)
            logger.info(f"Successfully authenticated user: {user.get('username', 'unknown')}")
            return user
        else:
            logger.warning("Authorization header does not use Bearer format")
            return None
    except Exception as e:
        logger.warning(f"Authentication failed: {str(e)}")
        return None

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    request: Request,
    employee: EmployeeCreate,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    logger.info(f"Creating employee: {employee.username}")
    logger.info(f"Authenticated user: {current_user.get('username') if current_user else 'None'}")
    
    supabase = get_supabase()

    # Check if username exists
    logger.info(f"Checking if username {employee.username} exists")
    existing_user_check = supabase.table("employees").select("id", count='exact').eq("username", employee.username).execute()
    if existing_user_check.count > 0:
        logger.warning(f"Username {employee.username} already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    # Simplified role assignment logic
    assigned_role = "employee"  # Default role for self-registration
    
    # Only authenticated users with proper roles can create privileged users
    if employee.role in ["hr", "manager"]:
        if current_user and current_user.get("role") in ["hr", "admin"]:
            logger.info(f"Authorized to assign {employee.role} role")
            assigned_role = employee.role
        else:
            logger.warning(f"Unauthorized attempt to assign {employee.role} role")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to assign privileged roles."
            )
    
    # Create employee with hashed password
    employee_data = employee.model_dump()
    password = employee_data.pop("password")
    logger.info(f"Hashing password for {employee.username}")
    employee_data["password_hash"] = get_password_hash(password)
    employee_data["id"] = str(uuid.uuid4())
    employee_data["role"] = assigned_role
    
    logger.info(f"Inserting employee with role: {assigned_role}")

    # Insert into Supabase
    try:
        result = supabase.table("employees").insert(employee_data).execute()
        
        # Check for errors from Supabase insert
        if hasattr(result, 'error') and result.error:
            logger.error(f"Supabase error: {result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create employee: {result.error.message}")
        if not result.data:
            logger.error("No data returned from Supabase")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create employee, no data returned.")
        
        logger.info(f"Employee {employee.username} created successfully")
        return result.data[0]
    except Exception as e:
        logger.error(f"Exception during employee creation: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating employee: {str(e)}")

@router.get("/me", response_model=EmployeeResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    logger.info(f"Getting profile for {current_user.get('username')}")
    return current_user

@router.put("/me", response_model=EmployeeResponse)
async def update_my_profile(
    employee_update: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Updating profile for {current_user.get('username')}")
    supabase = get_supabase()
    update_data = employee_update.model_dump(exclude_unset=True)

    if not update_data:
        logger.warning("No update data provided")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    try:
        # Fix: Remove .select("*") or change the order
        result = supabase.table("employees").update(update_data).eq("id", current_user["id"]).execute()
        
        # If you need to get the updated record, do a separate query
        if not result.data:
            logger.warning(f"Employee not found or update failed for ID: {current_user['id']}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or update failed")
            
        # Get the updated record
        updated_record = supabase.table("employees").select("*").eq("id", current_user["id"]).execute()
        
        logger.info(f"Profile updated successfully for {current_user.get('username')}")
        return updated_record.data[0]
    except Exception as e:
        logger.error(f"Exception during profile update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating profile: {str(e)}")

@router.put("/admin/{employee_id_to_update}", response_model=EmployeeResponse, tags=["admin"])
async def admin_update_employee_profile(
    employee_id_to_update: str,
    employee_update_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Admin update for employee ID {employee_id_to_update} by {current_user.get('username')}")
    
    if current_user.get("role") not in ["hr", "manager", "admin"]:
        logger.warning(f"Unauthorized admin update attempt by {current_user.get('username')} with role {current_user.get('role')}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this action")

    supabase = get_supabase()
    update_payload = employee_update_data.model_dump(exclude_unset=True)

    if not update_payload:
        logger.warning("No update data provided")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    try:
        # First perform the update operation without selecting data
        update_result = supabase.table("employees").update(update_payload).eq("id", employee_id_to_update).execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            logger.error(f"Supabase error: {update_result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update employee: {update_result.error.message}")
        
        # Then fetch the updated record in a separate query
        select_result = supabase.table("employees").select("*").eq("id", employee_id_to_update).execute()
        
        if not select_result.data:
            logger.warning(f"Employee not found or update failed for ID: {employee_id_to_update}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee with id {employee_id_to_update} not found or update failed")

        logger.info(f"Admin update successful for employee ID {employee_id_to_update}")
        return select_result.data[0]
    except Exception as e:
        logger.error(f"Exception during admin update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating employee: {str(e)}")

@router.put("/{employee_id}/salary", response_model=EmployeeConfidential, tags=["admin"])
async def update_salary(
    employee_id: str,
    salary_payload: float = Body(..., embed=True, alias="salary"),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Salary update for employee ID {employee_id} by {current_user.get('username')}")
    
    if current_user.get("role") not in ["hr", "manager", "admin"]:
        logger.warning(f"Unauthorized salary update attempt by {current_user.get('username')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    supabase = get_supabase()
    try:
        result = supabase.table("employees").update({"salary": salary_payload}).eq("id", employee_id).select("*").execute()

        if hasattr(result, 'error') and result.error:
            logger.error(f"Supabase error: {result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update salary: {result.error.message}")
        if not result.data:
            logger.warning(f"Employee not found or salary update failed for ID: {employee_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or salary update failed")

        logger.info(f"Salary updated successfully for employee ID {employee_id}")
        return result.data[0]
    except Exception as e:
        logger.error(f"Exception during salary update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating salary: {str(e)}")

@router.get("/api/employee", response_model=Union[EmployeeResponse, List[EmployeeResponse]])
async def get_employee_by_id_or_name(
    employee_id: Optional[str] = None,
    name: Optional[str] = None,
    # Add an optional token for service-to-service auth
    service_token: Optional[str] = Header(None, alias="X-Service-API-Key")
):
    """
    Microservice endpoint to retrieve employee details by ID or name.
    This endpoint serves as an internal API for other services to access employee data.
    
    Parameters:
    - employee_id: The unique ID of the employee to retrieve
    - name: The name (first name, last name, or both) to search for
    - service_token: Optional service API key for service-to-service authentication
    
    Returns:
    - A single employee record if employee_id is provided or exact name match
    - A list of employee records if multiple employees match the name criteria
    - 404 if no employees are found
    """
    logger.info(f"API search for employee - ID: {employee_id}, Name: {name}")
    
    # Check service token if provided
    if service_token:
        # TODO: Add validation for service token if desired
        logger.info("Service token provided for API access")
    
    supabase = get_supabase()
    
    # If no parameters, return all employees (with a reasonable limit)
    if not employee_id and not name:
        logger.info("No search criteria provided, returning limited list of employees")
        try:
            result = supabase.table("employees").select(
                "id, first_name, last_name, job_title, department, email, phone, role, created_at"
            ).limit(100).execute()  # Add a reasonable limit
            
            if not result.data:
                logger.warning("No employees found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No employees found")
                
            logger.info(f"Found {len(result.data)} employees")
            return result.data
        except Exception as e:
            logger.error(f"Exception during employee search: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error searching employees: {str(e)}")

    # Build query for searching by ID or name
    query = supabase.table("employees").select(
        "id, first_name, last_name, job_title, department, email, phone, role, created_at"
    )

    if employee_id:
        logger.info(f"Searching by ID: {employee_id}")
        query = query.eq("id", employee_id)
    elif name:
        parts = name.split()
        if len(parts) > 1:
            first_name_pattern = f"%{parts[0]}%"
            last_name_pattern = f"%{' '.join(parts[1:])}%"
            logger.info(f"Searching by first and last name: {first_name_pattern}, {last_name_pattern}")
            query = query.ilike("first_name", first_name_pattern).ilike("last_name", last_name_pattern)
        else:
            name_pattern = f"%{name}%"
            logger.info(f"Searching by name pattern: {name_pattern}")
            query = query.or_(f"first_name.ilike.{name_pattern},last_name.ilike.{name_pattern}")

    try:
        result = query.execute()

        if hasattr(result, 'error') and result.error:
            logger.error(f"Supabase error: {result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching employee: {result.error.message}")

        if not result.data:
            logger.warning("No employees found matching criteria")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        if name and not employee_id and len(result.data) > 1:
            logger.info(f"Found {len(result.data)} employees matching name criteria")
            return result.data

        logger.info("Found one employee matching criteria")
        return result.data[0]
    except Exception as e:
        logger.error(f"Exception during employee search: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error searching employees: {str(e)}")