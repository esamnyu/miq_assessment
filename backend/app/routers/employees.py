from fastapi import APIRouter, Depends, HTTPException, status, Body, Request, Header
from typing import List, Optional, Union, Dict, Any # Added Dict, Any
from app.models.employee import (
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeConfidential,
    MCPRequest, # Added MCPRequest
    MCPResponse, # Added MCPResponse
    MCPContext,  # Added MCPContext
)
from app.auth.auth import get_current_user, get_password_hash # oauth2_scheme removed as get_optional_current_user handles token extraction
from app.db.supabase_client import get_supabase
import uuid
import logging
from datetime import datetime # Added datetime

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
            # Assuming get_current_user now takes the token directly
            user = await get_current_user(token=token) 
            logger.info(f"Successfully authenticated user: {user.get('username', 'unknown')}")
            return user
        else:
            logger.warning("Authorization header does not use Bearer format")
            return None
    except HTTPException as http_exc: # Catch HTTPException from get_current_user
        logger.warning(f"Authentication failed (HTTPException): {http_exc.detail}")
        return None
    except Exception as e:
        logger.warning(f"Authentication failed (General Exception): {str(e)}")
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
    if employee.role in ["hr", "manager", "admin"]: # Added admin role here for consistency
        if current_user and current_user.get("role") in ["hr", "admin"]:
            logger.info(f"Authorized to assign {employee.role} role")
            assigned_role = employee.role
        else:
            logger.warning(f"Unauthorized attempt to assign {employee.role} role by user {current_user.get('username') if current_user else 'unauthenticated'}")
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
    employee_data["created_at"] = datetime.utcnow().isoformat() # Add created_at
    
    logger.info(f"Inserting employee with role: {assigned_role}")

    # Insert into Supabase
    try:
        result = supabase.table("employees").insert(employee_data).execute()
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Supabase error: {result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create employee: {result.error.message}")
        if not result.data:
            logger.error("No data returned from Supabase after insert")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create employee, no data returned.")
        
        logger.info(f"Employee {employee.username} created successfully with ID {result.data[0].get('id')}")
        return result.data[0]
    except Exception as e:
        logger.error(f"Exception during employee creation: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating employee: {str(e)}")


async def get_required_current_user(authorization: str = Header(...)) -> dict:
    """
    Requires authentication. Extracts token and calls get_current_user.
    Raises 401 if no token or invalid token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Authorization header missing or not Bearer type for required auth.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.replace("Bearer ", "")
    try:
        user = await get_current_user(token=token) 
        if not user: 
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token or user not found")
        return user
    except HTTPException as e: 
        raise e
    except Exception as e: 
        logger.error(f"Error in get_required_current_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication error")


@router.get("/me", response_model=EmployeeResponse)
async def get_my_profile(current_user: dict = Depends(get_required_current_user)):
    logger.info(f"Getting profile for {current_user.get('username')}")
    return current_user


@router.put("/me", response_model=EmployeeResponse)
async def update_my_profile(
    employee_update: EmployeeUpdate,
    current_user: dict = Depends(get_required_current_user)
):
    logger.info(f"Updating profile for {current_user.get('username')}")
    supabase = get_supabase()
    update_data = employee_update.model_dump(exclude_unset=True)

    if not update_data:
        logger.warning("No update data provided")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    try:
        update_result = supabase.table("employees").update(update_data).eq("id", current_user["id"]).execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            logger.error(f"Supabase error during update: {update_result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update profile: {update_result.error.message}")

        select_fields = "id, username, email, first_name, last_name, job_title, department, phone, role, created_at"
        updated_record_result = supabase.table("employees").select(select_fields).eq("id", current_user["id"]).execute()
        
        if not updated_record_result.data:
            logger.warning(f"Employee not found after update for ID: {current_user['id']}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found after update")
            
        logger.info(f"Profile updated successfully for {current_user.get('username')}")
        return updated_record_result.data[0]
    except Exception as e:
        logger.error(f"Exception during profile update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating profile: {str(e)}")

@router.put("/admin/{employee_id_to_update}", response_model=EmployeeResponse, tags=["admin"])
async def admin_update_employee_profile(
    employee_id_to_update: str,
    employee_update_data: EmployeeUpdate,
    current_user: dict = Depends(get_required_current_user)
):
    logger.info(f"Admin update for employee ID {employee_id_to_update} by {current_user.get('username')}")
    
    if current_user.get("role") not in ["hr", "manager", "admin"]:
        logger.warning(f"Unauthorized admin update attempt by {current_user.get('username')} with role {current_user.get('role')}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this action")

    supabase = get_supabase()
    update_payload = employee_update_data.model_dump(exclude_unset=True)

    if not update_payload:
        logger.warning("No update data provided for admin update")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    try:
        update_result = supabase.table("employees").update(update_payload).eq("id", employee_id_to_update).execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            logger.error(f"Supabase error during admin update: {update_result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update employee: {update_result.error.message}")
        
        select_fields = "id, username, email, first_name, last_name, job_title, department, phone, role, created_at"
        select_result = supabase.table("employees").select(select_fields).eq("id", employee_id_to_update).execute()
        
        if not select_result.data:
            logger.warning(f"Employee not found after admin update for ID: {employee_id_to_update}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee with id {employee_id_to_update} not found or update effectively removed it (which shouldn't happen here)")

        logger.info(f"Admin update successful for employee ID {employee_id_to_update}")
        return select_result.data[0]
    except Exception as e:
        logger.error(f"Exception during admin update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating employee: {str(e)}")

@router.put("/{employee_id}/salary", response_model=EmployeeConfidential, tags=["admin"])
async def update_salary(
    employee_id: str,
    salary_payload: float = Body(..., embed=True, alias="salary"),
    current_user: dict = Depends(get_required_current_user)
):
    logger.info(f"Salary update for employee ID {employee_id} by {current_user.get('username')}")
    
    if current_user.get("role") not in ["hr", "manager", "admin"]:
        logger.warning(f"Unauthorized salary update attempt by {current_user.get('username')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update salary"
        )

    supabase = get_supabase()
    try:
        # First perform the update
        update_result = supabase.table("employees").update({"salary": salary_payload}).eq("id", employee_id).execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            logger.error(f"Supabase error during salary update: {update_result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update salary: {update_result.error.message}")
        
        # Then fetch the updated record
        select_fields = "id, username, email, first_name, last_name, job_title, department, phone, role, created_at, salary"
        select_result = supabase.table("employees").select(select_fields).eq("id", employee_id).execute()
        
        if not select_result.data:
            logger.warning(f"Employee not found after salary update for ID: {employee_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found after salary update")

        logger.info(f"Salary updated successfully for employee ID {employee_id}")
        return select_result.data[0]
    except Exception as e:
        logger.error(f"Exception during salary update: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating salary: {str(e)}")

EMPLOYEE_PUBLIC_FIELDS = "id, username, first_name, last_name, job_title, department, email, phone, role, created_at"

@router.get("/api/employee", response_model=Union[EmployeeResponse, List[EmployeeResponse]], tags=["microservice"])
async def get_employee_by_id_or_name(
    employee_id: Optional[str] = None,
    name: Optional[str] = None,
    service_token: Optional[str] = Header(None, alias="X-Service-API-Key") 
):
    logger.info(f"API search for employee - ID: {employee_id}, Name: {name}")
    
    if service_token:
        logger.info(f"Service token provided: {service_token[:10]}...") 
    
    supabase = get_supabase()
    
    try:
        if not employee_id and not name:
            logger.info("No search criteria provided for /api/employee, returning limited list of employees")
            result = supabase.table("employees").select(EMPLOYEE_PUBLIC_FIELDS).limit(100).execute()
            
            if not result.data:
                logger.warning("No employees found in the system.")
                return [] 
                
            logger.info(f"Found {len(result.data)} employees (limited to 100).")
            return result.data

        query = supabase.table("employees").select(EMPLOYEE_PUBLIC_FIELDS)

        if employee_id:
            logger.info(f"Searching by ID: {employee_id}")
            query = query.eq("id", employee_id)
        elif name:
            parts = name.split()
            if len(parts) > 1: 
                first_name_pattern = f"%{parts[0]}%"
                last_name_pattern = f"%{' '.join(parts[1:])}%" 
                logger.info(f"Searching by first name pattern: '{first_name_pattern}' and last name pattern: '{last_name_pattern}'")
                query = query.ilike("first_name", first_name_pattern).ilike("last_name", last_name_pattern)
            else: 
                name_pattern = f"%{name}%"
                logger.info(f"Searching by general name pattern: '{name_pattern}'")
                query = query.or_(f"first_name.ilike.{name_pattern},last_name.ilike.{name_pattern},username.ilike.{name_pattern}")

        result = query.execute()

        if hasattr(result, 'error') and result.error:
            logger.error(f"Supabase error on /api/employee: {result.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching employee(s): {result.error.message}")

        if not result.data:
            logger.warning(f"No employees found matching criteria: ID '{employee_id}', Name '{name}'")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        if employee_id:
             logger.info(f"Found employee by ID: {result.data[0].get('username')}")
             return result.data[0]

        logger.info(f"Found {len(result.data)} employee(s) matching name criteria for '{name}'")
        return result.data

    except HTTPException: 
        raise
    except Exception as e:
        logger.error(f"General exception during /api/employee search: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error searching employees: {str(e)}")


@router.post("/api/mcp", response_model=MCPResponse, tags=["microservice"])
async def employee_mcp(
    request: MCPRequest,
    service_token: Optional[str] = Header(None, alias="X-Service-API-Key") 
):
    """
    Model-Context-Protocol endpoint for employee data retrieval.
    Designed for integration with agentic workflows.

    Supported actions:
    - get_employee: Get employee by ID. Params: {"employee_id": "uuid_str"}
    - search_employees: Search employees by name. Params: {"name": "search_term", "limit": optional_int}
    - list_employees: List all employees. Params: {"limit": optional_int}
    """
    if request.context:
        context = request.context
        context.service = "employee-service" 
        context.timestamp = datetime.utcnow() 
    else:
        context = MCPContext(service="employee-service")

    if service_token:
        context.caller = "authenticated-service"
        logger.info(f"MCP request from authenticated service (token found). Action: {request.action}")

    supabase = get_supabase()
    
    try:
        action = request.action
        params = request.parameters

        if action == "get_employee":
            employee_id = params.get("employee_id")
            if not employee_id or not isinstance(employee_id, str):
                logger.warning(f"MCP 'get_employee': missing or invalid employee_id: {employee_id}")
                return MCPResponse(
                    status="error",
                    error={"code": "MISSING_OR_INVALID_PARAMETER", "message": "Valid 'employee_id' (string) parameter is required"},
                    context=context
                )
            
            result = supabase.table("employees").select(EMPLOYEE_PUBLIC_FIELDS).eq("id", employee_id).execute()
            
            if hasattr(result, 'error') and result.error:
                logger.error(f"MCP 'get_employee' Supabase error: {result.error}")
                return MCPResponse(status="error", error={"code": "DB_ERROR", "message": result.error.message}, context=context)
            if not result.data:
                logger.info(f"MCP 'get_employee': Employee not found for ID {employee_id}")
                return MCPResponse(status="error", error={"code": "NOT_FOUND", "message": f"Employee with ID '{employee_id}' not found"}, context=context)
            
            logger.info(f"MCP 'get_employee': Success for ID {employee_id}")
            return MCPResponse(status="success", data=result.data[0], context=context)

        elif action == "search_employees":
            name = params.get("name")
            limit = params.get("limit", 20) 
            if not name or not isinstance(name, str):
                logger.warning(f"MCP 'search_employees': missing or invalid name: {name}")
                return MCPResponse(
                    status="error",
                    error={"code": "MISSING_OR_INVALID_PARAMETER", "message": "Valid 'name' (string) parameter is required"},
                    context=context
                )

            name_pattern = f"%{name}%"
            query = supabase.table("employees").select(EMPLOYEE_PUBLIC_FIELDS).or_(
                f"first_name.ilike.{name_pattern},last_name.ilike.{name_pattern},username.ilike.{name_pattern},email.ilike.{name_pattern}"
            ).limit(limit)
            
            result = query.execute()

            if hasattr(result, 'error') and result.error:
                logger.error(f"MCP 'search_employees' Supabase error: {result.error}")
                return MCPResponse(status="error", error={"code": "DB_ERROR", "message": result.error.message}, context=context)
            
            logger.info(f"MCP 'search_employees': Found {len(result.data)} for name '{name}' (limit {limit})")
            return MCPResponse(status="success", data=result.data, context=context)

        elif action == "list_employees":
            limit = params.get("limit", 100) 
            result = supabase.table("employees").select(EMPLOYEE_PUBLIC_FIELDS).limit(limit).execute()

            if hasattr(result, 'error') and result.error:
                logger.error(f"MCP 'list_employees' Supabase error: {result.error}")
                return MCPResponse(status="error", error={"code": "DB_ERROR", "message": result.error.message}, context=context)

            logger.info(f"MCP 'list_employees': Returning {len(result.data)} employees (limit {limit})")
            return MCPResponse(status="success", data=result.data, context=context)

        else:
            logger.warning(f"MCP: Invalid action '{action}' requested.")
            return MCPResponse(
                status="error",
                error={"code": "INVALID_ACTION", "message": f"Action '{action}' is not supported. Supported actions: get_employee, search_employees, list_employees."},
                context=context
            )

    except Exception as e:
        logger.error(f"MCP endpoint critical error: {str(e)} for action {request.action}", exc_info=True)
        return MCPResponse(
            status="error",
            error={"code": "INTERNAL_SERVER_ERROR", "message": f"An unexpected error occurred: {str(e)}"},
            context=context
        )

@router.get("/api/health", tags=["microservice"])
async def health_check():
    """Health check endpoint for the employee microservice."""
    supabase = get_supabase()
    service_name = "employee-service"
    current_time = datetime.utcnow().isoformat()
    
    try:
        result = supabase.table("employees").select("id").limit(1).execute() 
        return {
            "status": "healthy",
            "service": service_name,
            "timestamp": current_time,
            "dependencies": {
                "supabase": "healthy"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed for {service_name}: {str(e)}")
        return {
            "status": "unhealthy",
            "service": service_name,
            "timestamp": current_time,
            "error": f"Failed to connect to dependencies or other issue: {str(e)}",
            "dependencies": {
                "supabase": "unhealthy"
            }
        }

# --- New MCP Specific Health Check Endpoint ---
@router.get("/api/mcp/health", tags=["microservice"])
async def mcp_health_check():
    """Health check endpoint for the MCP microservice aspects."""
    supabase = get_supabase()
    service_name = "employee-mcp-service" # Distinguish from general service health
    current_time = datetime.utcnow().isoformat()
    
    try:
        # Simple health check query to ensure DB connectivity, same as general health
        # but contextually for MCP.
        result = supabase.table("employees").select("id").limit(1).execute() 
        # No need to check result.error, execute() would raise if there's an issue.

        return {
            "status": "healthy",
            "service": service_name,
            "timestamp": current_time,
            "api_version": "1.0", # Specific to MCP API if versioned
            "dependencies": {
                "supabase": "healthy" # MCP also depends on Supabase
            },
            "notes": "Health check for Model-Context-Protocol specific functionalities."
        }
    except Exception as e:
        logger.error(f"MCP Health check failed for {service_name}: {str(e)}")
        return {
            "status": "unhealthy",
            "service": service_name,
            "timestamp": current_time,
            "error": f"Failed to connect to database or other MCP dependency: {str(e)}",
            "dependencies": {
                "supabase": "unhealthy"
            },
            "notes": "MCP service health check failed."
        }
    
@router.get("/{employee_id}/confidential", response_model=EmployeeConfidential, tags=["admin"])
async def get_employee_confidential(
    employee_id: str,
    current_user: dict = Depends(get_required_current_user)
):
    """
    Get employee confidential information including salary.
    Only accessible by HR, managers, or the employee themselves.
    """
    logger.info(f"Fetching confidential info for employee ID {employee_id} by {current_user.get('username')}")
    
    # Check permissions: User must be HR, manager, or the employee themselves
    is_authorized = (
        current_user.get("role") in ["hr", "manager", "admin"] or 
        current_user.get("id") == employee_id
    )
    
    if not is_authorized:
        logger.warning(f"Unauthorized attempt to access confidential info by {current_user.get('username')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access confidential employee information"
        )
    
    supabase = get_supabase()
    try:
        # Include salary in the fields
        select_fields = "id, username, email, first_name, last_name, job_title, department, phone, role, created_at, salary"
        result = supabase.table("employees").select(select_fields).eq("id", employee_id).execute()
        
        if not result.data:
            logger.warning(f"Employee not found for ID: {employee_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
            
        logger.info(f"Confidential info retrieved successfully for {employee_id}")
        return result.data[0]
    except Exception as e:
        logger.error(f"Exception during confidential info retrieval: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving confidential information: {str(e)}")