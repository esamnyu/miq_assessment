from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models.employee import EmployeeBase, EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeConfidential
from app.auth.auth import get_current_user, create_access_token, get_password_hash
from app.db.supabase_client import get_supabase
import uuid

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("/", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate):
    supabase = get_supabase()
    
    # Check if username exists
    existing = supabase.table("employees").select("*").eq("username", employee.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create employee with hashed password
    employee_data = employee.dict()
    password = employee_data.pop("password")
    employee_data["password_hash"] = get_password_hash(password)
    employee_data["id"] = str(uuid.uuid4())
    
    # Insert into Supabase
    result = supabase.table("employees").insert(employee_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create employee")
    
    return result.data[0]

@router.get("/me", response_model=EmployeeResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=EmployeeResponse)
async def update_my_profile(
    employee_update: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    
    # Update employee
    update_data = employee_update.dict(exclude_unset=True)
    result = supabase.table("employees").update(update_data).eq("id", current_user["id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update employee")
    
    return result.data[0]

@router.put("/{employee_id}/salary", response_model=EmployeeConfidential)
async def update_salary(
    employee_id: str,
    salary: float,
    current_user: dict = Depends(get_current_user)
):
    # Check if user is HR or manager
    if current_user["role"] not in ["hr", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    supabase = get_supabase()
    result = supabase.table("employees").update({"salary": salary}).eq("id", employee_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return result.data[0]

@router.get("/api/employee", response_model=EmployeeResponse)
async def get_employee_by_id_or_name(
    employee_id: Optional[str] = None,
    name: Optional[str] = None
):
    supabase = get_supabase()
    
    if employee_id:
        result = supabase.table("employees").select("*").eq("id", employee_id).execute()
    elif name:
        # Split name into first and last
        parts = name.split()
        if len(parts) > 1:
            first_name = parts[0]
            last_name = " ".join(parts[1:])
            result = supabase.table("employees").select("*").eq("first_name", first_name).eq("last_name", last_name).execute()
        else:
            # Try matching with either first or last name
            result = supabase.table("employees").select("*").or_(f"first_name.eq.{name},last_name.eq.{name}").execute()
    else:
        raise HTTPException(status_code=400, detail="Either employee_id or name must be provided")
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return result.data[0]
