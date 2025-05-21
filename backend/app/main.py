import logging
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("app")

# Log startup information
logger.info("Starting application...")

# Load environment variables from a .env file if it exists
load_dotenv()
logger.info("Environment variables loaded from .env file (if exists)")

# Log critical environment variables (without revealing sensitive values)
for env_var in ["SUPABASE_URL", "SUPABASE_KEY", "JWT_SECRET", "PORT", "ALLOWED_ORIGINS"]:
    logger.info(f"Environment variable {env_var}: {'SET' if os.getenv(env_var) else 'NOT SET'}")

try:
    # Import your routers
    from app.routers import employees, auth, supabase_test as supabase_test_router
    logger.info("Routers imported successfully")

    # Initialize the FastAPI application
    app = FastAPI(title="Employee Onboarding API", version="0.1.0")
    logger.info("FastAPI application initialized")

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware configured")

    # Include your routers into the main application
    app.include_router(employees.router)
    app.include_router(auth.router)
    app.include_router(supabase_test_router.router)
    logger.info("Routers included in application")

    # Root endpoint
    @app.get("/", tags=["default"])
    async def root():
        """
        Root endpoint for the Employee Onboarding API.
        Provides a welcome message indicating the API is running.
        """
        return {"message": "Employee Onboarding API is running"}

    # Health check endpoint with Supabase connection test
    @app.get("/health", tags=["default"])
    async def health_check():
        """
        Health check endpoint.
        Returns a status of 'healthy' if the API is operational.
        Used by monitoring services to check application health.
        """
        logger.info("Health check endpoint called")
        
        # Test environment variables
        env_status = {
            var: "SET" if os.getenv(var) else "MISSING" 
            for var in ["SUPABASE_URL", "SUPABASE_KEY", "JWT_SECRET"]
        }
        
        # Basic Supabase connectivity check
        try:
            from app.db.supabase_client import get_supabase
            supabase = get_supabase()
            # Just test that we can get a connection, don't query anything
            supabase_status = "connected"
        except Exception as e:
            logger.error(f"Supabase connection error: {str(e)}")
            supabase_status = f"error: {str(e)}"
            
        return {
            "status": "healthy",
            "environment": env_status,
            "supabase": supabase_status
        }

    logger.info("Application startup complete and ready to handle requests")

except Exception as e:
    logger.error(f"Application startup failed: {str(e)}", exc_info=True)
    raise