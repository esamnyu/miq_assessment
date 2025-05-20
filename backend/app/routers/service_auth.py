# Updated file: app/routers/service_auth.py

import time
import logging
import secrets
from typing import Dict, Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel

from app.config.settings import settings

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/services", tags=["services"])

# API key header for service authentication
SERVICE_API_KEY_HEADER = APIKeyHeader(name="X-Service-API-Key", auto_error=False)

# Simple in-memory rate limiting (would use Redis in production)
rate_limit_store: Dict[str, Dict] = {}
RATE_LIMIT_MAX = 100  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds

# Response model for token
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    service: str

def get_service_from_api_key(
    api_key: Optional[str] = Depends(SERVICE_API_KEY_HEADER),
    request: Request = None
) -> str:
    """
    Validate service API key and return service name.
    
    Args:
        api_key: The API key from the X-Service-API-Key header
        request: The FastAPI request object for rate limiting
        
    Returns:
        The service name corresponding to the API key
        
    Raises:
        HTTPException: If the API key is missing, invalid, or rate-limited
    """
    if not api_key:
        logger.warning(f"Missing API key in request from {request.client.host if request else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service API key",
            headers={"WWW-Authenticate": "APIKey"},
        )
    
    # Check against predefined service API keys
    for service_name, valid_key in SERVICE_API_KEYS.items():
        if valid_key and secrets.compare_digest(api_key, valid_key):
            # Rate limiting check
            if request:
                if _check_rate_limit(service_name, request.client.host):
                    logger.info(f"Authenticated service: {service_name}")
                    return service_name
                else:
                    logger.warning(f"Rate limit exceeded for service: {service_name}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded",
                        headers={"Retry-After": "60"},
                    )
            return service_name
    
    logger.warning(f"Invalid API key attempt from {request.client.host if request else 'unknown'}")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API key",
    )

def _check_rate_limit(service_name: str, client_ip: str) -> bool:
    """
    Simple in-memory rate limiting implementation.
    In production, use Redis or a dedicated rate limiting service.
    
    Args:
        service_name: The name of the service
        client_ip: The client IP address
        
    Returns:
        True if within rate limits, False if exceeded
    """
    key = f"{service_name}:{client_ip}"
    now = int(time.time())
    
    if key not in rate_limit_store:
        rate_limit_store[key] = {"count": 1, "reset_at": now + RATE_LIMIT_WINDOW}
        return True
    
    store = rate_limit_store[key]
    
    # Reset counter if window has passed
    if now >= store["reset_at"]:
        store["count"] = 1
        store["reset_at"] = now + RATE_LIMIT_WINDOW
        return True
    
    # Increment counter and check limits
    store["count"] += 1
    return store["count"] <= RATE_LIMIT_MAX

def validate_service_token(token: str) -> Optional[Dict]:
    """
    Validate a service JWT token.
    
    Args:
        token: The JWT token to validate
        
    Returns:
        The decoded token payload if valid
        
    Raises:
        jwt.InvalidTokenError: If the token is invalid
    """
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm],
            options={"verify_signature": True}
        )
        
        # Check if it's a service token
        if not payload.get("service", False):
            logger.warning("Token is not a service token")
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Expired service token")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid service token: {str(e)}")
        return None

# Predefined service API keys (in real-world, store securely)
SERVICE_API_KEYS = {
    "analytics-service": settings.analytics_service_api_key,
    "hr-integration": settings.hr_integration_api_key,
    "chatbot-agent": settings.chatbot_agent_api_key,
    "employee-dashboard": settings.get("employee_dashboard_api_key", ""),  # Added a new service
}

@router.post("/token", response_model=TokenResponse, summary="Get service-to-service JWT token")
async def get_service_token(
    service_name: str = Depends(get_service_from_api_key),
    request: Request = None
):
    """
    Generate a short-lived JWT token for service-to-service authentication.
    This token can be used to access the employee API.
    
    Args:
        service_name: The authenticated service name (from API key)
        request: The FastAPI request object
        
    Returns:
        A response containing the generated JWT token
    """
    logger.info(f"Generating service token for: {service_name}")
    
    # Default expiration: 1 hour
    expiration = int(time.time()) + 3600
    
    # Create the token payload
    payload = {
        "sub": service_name,
        "exp": expiration,
        "service": True,
        "iat": int(time.time()),  # Issued at
        "iss": "employee-onboarding-api"  # Issuer
    }
    
    # Generate the token
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 3600,
        "service": service_name
    }

@router.get("/verify", summary="Verify a service token")
async def verify_service_token(
    request: Request,
    service_name: str = Depends(get_service_from_api_key)
):
    """
    Verify a service token from the Authorization header.
    Used by services to validate tokens before processing requests.
    
    Args:
        request: The FastAPI request object
        service_name: The authenticated service name (from API key)
        
    Returns:
        The token payload if valid
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.replace("Bearer ", "")
    payload = validate_service_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "valid": True,
        "service": payload["sub"],
        "expires_at": payload["exp"]
    }