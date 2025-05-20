import os
import logging
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Initialize logging
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get runtime environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT.lower() in ("production", "prod")

class Settings(BaseSettings):
    # Environment information
    environment: str = ENVIRONMENT
    is_production: bool = IS_PRODUCTION
    
    # Supabase settings - Use Optional type with defaults to prevent validation errors
    supabase_url: Optional[str] = os.getenv("SUPABASE_URL")
    supabase_key: Optional[str] = os.getenv("SUPABASE_KEY")
    
    # FastAPI settings
    api_title: str = "Employee Onboarding API"
    api_description: str = "API for employee onboarding portal"
    api_version: str = "1.0.0"
    
    # JWT settings
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = int(os.getenv("JWT_EXPIRES_MINUTES", "30"))
    
    # Default service API keys (empty by default, should be set in production)
    analytics_service_api_key: Optional[str] = os.getenv("ANALYTICS_SERVICE_API_KEY") 
    hr_integration_api_key: Optional[str] = os.getenv("HR_INTEGRATION_API_KEY")
    chatbot_agent_api_key: Optional[str] = os.getenv("CHATBOT_AGENT_API_KEY")
    
    # CORS settings
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        
    def check_settings(self) -> None:
        """
        Check settings and log warnings for missing values.
        Does not raise errors in development, but logs warnings.
        """
        missing_vars = []
        
        # Check Supabase settings
        if not self.supabase_url:
            missing_vars.append("SUPABASE_URL")
        if not self.supabase_key:
            missing_vars.append("SUPABASE_KEY")
            
        # Check JWT secret
        if not self.jwt_secret:
            missing_vars.append("JWT_SECRET")
        elif self.jwt_secret == "your-secret-key-change-in-production":
            if self.is_production:
                logger.error("CRITICAL SECURITY ISSUE: Default JWT_SECRET used in production!")
            else:
                logger.warning("Using default JWT_SECRET. This is fine for development, but must be changed for production.")
        
        # Log missing variables
        if missing_vars:
            vars_str = ", ".join(missing_vars)
            if self.is_production:
                logger.error(f"Critical environment variables missing in production: {vars_str}")
            else:
                logger.warning(f"Missing environment variables: {vars_str}. Some functionality may not work properly.")

# Initialize settings
settings = Settings()

# Check settings on import - logs warnings but doesn't crash in development
settings.check_settings()