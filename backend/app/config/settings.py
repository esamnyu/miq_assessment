import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Supabase settings
    supabase_url: str = os.getenv("SUPABASE_URL", "https://abjwrwnsghbmtokmgxth.supabase.co")
    supabase_key: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiandyd25zZ2hibXRva21neHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1M30.X9dJEBprQZcnO0FQQn-f-WLXV4qbHgBQGJOwVH3bLeI")
    
    # FastAPI settings
    api_title: str = "Employee Onboarding API"
    api_description: str = "API for employee onboarding portal"
    api_version: str = "1.0.0"
    
    # JWT settings
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 30

settings = Settings()
