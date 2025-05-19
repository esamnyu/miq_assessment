from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Import your routers
# These lines import the router objects from your other files in the app.routers package.
# Make sure you have:
# - app/routers/employees.py (with a 'router' instance)
# - app/routers/auth.py (with a 'router' instance)
# - app/routers/supabase_test.py (with a 'router' instance, aliased here as supabase_test_router)
from app.routers import employees, auth, supabase_test as supabase_test_router

# Load environment variables from a .env file if it exists
load_dotenv()

# Initialize the FastAPI application
# The title and version will appear in your API documentation.
app = FastAPI(title="Employee Onboarding API", version="0.1.0")

# Configure CORS (Cross-Origin Resource Sharing)
# This middleware allows your frontend (running on a different port/domain)
# to make requests to this backend API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins. For production, restrict this to your frontend's domain.
    allow_credentials=True, # Allows cookies to be included in cross-origin requests.
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.).
    allow_headers=["*"],  # Allows all headers.
)

# Include your routers into the main application
# This makes all the endpoints defined in those router files accessible.
app.include_router(employees.router)
app.include_router(auth.router)
app.include_router(supabase_test_router.router) # This includes the /supabase/test endpoint

# Root endpoint
@app.get("/", tags=["default"])
async def root():
    """
    Root endpoint for the Employee Onboarding API.
    Provides a welcome message indicating the API is running.
    """
    return {"message": "Employee Onboarding API is running"}

# Health check endpoint
@app.get("/health", tags=["default"])
async def health_check():
    """
    Health check endpoint.
    Returns a status of 'healthy' if the API is operational.
    Used by monitoring services to check application health.
    """
    return {"status": "healthy"}

# Note: The original /supabase/test endpoint that might have been defined directly in main.py
# is now expected to be in app/routers/supabase_test.py and included via its router.
# This promotes better organization by keeping route definitions in their respective router files.
