from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

class MCPContext(BaseModel):
    """Context information for MCP requests and responses."""
    service: str = "employee-service"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
    caller: Optional[str] = None
    # Additional context metadata can be added here

class MCPRequest(BaseModel):
    """Standard MCP request format."""
    action: str
    parameters: Dict[str, Any] = {}
    context: Optional[MCPContext] = None

class MCPResponse(BaseModel):
    """Standard MCP response format."""
    status: str  # "success" or "error"
    data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    error: Optional[Dict[str, Any]] = None
    context: MCPContext