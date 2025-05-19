from fastapi import APIRouter, Depends
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/supabase", tags=["supabase"])

@router.get("/test")
async def test_supabase_connection():
    supabase = get_supabase()
    try:
        # Simple test query
        result = supabase.table("employees").select("*").limit(1).execute()
        return {
            "status": "connected",
            "message": "Successfully connected to Supabase",
            "data_returned": bool(result.data)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error connecting to Supabase: {str(e)}"
        }
