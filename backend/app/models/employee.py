from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# This represents the data structure when communicating with Supabase
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    job_title: str
    department: str
    email: str
    phone: Optional[str] = None
    role: str = "employee"  # employee, hr, manager

class EmployeeCreate(EmployeeBase):
    username: str
    password: str

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class EmployeeConfidential(EmployeeResponse):
    salary: Optional[float] = None
