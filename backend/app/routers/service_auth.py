# New file: app/routers/service_auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from app.config.settings import settings
import secrets
import time
import jwt

router = APIRouter(prefix="/services", tags=["services"])

# API key header for service authentication
SERVICE_API_KEY_HEADER = APIKeyHeader(name="X-Service-API-Key")

# Predefined service API keys (in real-world, store securely)
SERVICE_API_KEYS = {
    "analytics-service": settings.analytics_service_api_key,
    "hr-integration": settings.hr_integration_api_key,
    "chatbot-agent": settings.chatbot_agent_api_key,
}

def get_service_from_api_key(api_key: str = Depends(SERVICE_API_KEY_HEADER)):
    """Validate service API key and return service name"""
    for service_name, valid_key in SERVICE_API_KEYS.items():
        if secrets.compare_digest(api_key, valid_key):
            return service_name
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API key"
    )

@router.post("/token", summary="Get service-to-service JWT token")
async def get_service_token(service_name: str = Depends(get_service_from_api_key)):
    """
    Generate a short-lived JWT token for service-to-service authentication.
    This token can be used to access the employee API.
    """
    expiration = int(time.time()) + 3600  # 1 hour expiration
    payload = {
        "sub": service_name,
        "exp": expiration,
        "service": True
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return {"access_token": token, "token_type": "bearer", "expires_in": 3600}