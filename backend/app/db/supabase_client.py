from supabase import create_client
from app.config.settings import settings
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Global supabase client variable
_supabase = None

def get_supabase():
    """
    Returns a Supabase client instance, creating it if it doesn't exist.
    Includes error handling for connection issues.
    """
    global _supabase
    
    if _supabase is not None:
        return _supabase
    
    try:
        # Log connection attempt (without exposing full credentials)
        supabase_url = settings.supabase_url or ""
        logger.info(f"Connecting to Supabase: {supabase_url[:20]}..." if supabase_url else "Supabase URL not configured")
        
        # Validate URL format to provide better error messages
        if not supabase_url or not supabase_url.startswith("https://"):
            logger.error(f"Invalid Supabase URL format: URL should start with https:// - Got: {supabase_url[:20]}...")
            raise ValueError("Invalid Supabase URL format. Please check your SUPABASE_URL environment variable.")
        
        if not settings.supabase_key:
            logger.error("Missing Supabase key. Please check your SUPABASE_KEY environment variable.")
            raise ValueError("Missing Supabase key")
        
        # Create the client connection
        _supabase = create_client(settings.supabase_url, settings.supabase_key)
        logger.info("Successfully connected to Supabase.")
        return _supabase
        
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {str(e)}")
        # Re-raise the error to be handled by the caller
        raise