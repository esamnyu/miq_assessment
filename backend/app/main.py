from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Employee Onboarding API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add supabase test route
@app.get("/supabase/test")
async def test_supabase_connection():
    try:
        # Import supabase client directly here for simplicity
        from supabase import create_client
        
        # Get credentials from environment variables
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            return {
                "status": "error",
                "message": "Supabase credentials not found in environment variables",
                "error_type": "ConfigurationError"
            }
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Simple test query
        result = supabase.table("employees").select("*").limit(1).execute()
        
        # Extract data in a safe way
        data = result.data if hasattr(result, 'data') else []
        
        return {
            "status": "connected",
            "message": "Successfully connected to Supabase",
            "data_found": len(data) > 0,
            "record_count": len(data)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": str(type(e).__name__)
        }

@app.get("/")
async def root():
    return {"message": "Employee Onboarding API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
