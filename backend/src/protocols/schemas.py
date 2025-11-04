"""
A2A Protocol Schemas
Pydantic models for A2A protocol validation
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime


class AgentCard(BaseModel):
    """Agent card information"""

    id: str = Field(..., description="Unique agent identifier")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    capabilities: List[str] = Field(default_factory=list, description="Agent capabilities")
    protocol_version: str = Field(default="1.0.0", description="A2A protocol version")
    created_at: str = Field(..., description="Creation timestamp (ISO 8601)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @validator("created_at")
    def validate_timestamp(cls, v):
        """Validate ISO 8601 timestamp"""
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Invalid ISO 8601 timestamp")
        return v


class MessageRequest(BaseModel):
    """Message request from client"""

    content: str = Field(..., min_length=1, description="Message content")
    format: Literal["plain", "markdown", "code"] = Field(default="plain", description="Message format")
    session_id: Optional[str] = Field(None, description="Session identifier for context")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    stream: bool = Field(default=False, description="Enable streaming response")


class MessageResponse(BaseModel):
    """Message response from agent"""

    message_id: str = Field(..., description="Unique message identifier")
    content: str = Field(..., description="Response content")
    format: Literal["plain", "markdown", "code"] = Field(default="plain", description="Response format")
    timestamp: str = Field(..., description="Response timestamp (ISO 8601)")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Response metadata")

    @validator("timestamp")
    def validate_timestamp(cls, v):
        """Validate ISO 8601 timestamp"""
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Invalid ISO 8601 timestamp")
        return v


class StreamChunk(BaseModel):
    """Streaming response chunk"""

    chunk_id: int = Field(..., description="Chunk sequence number")
    content: str = Field(..., description="Chunk content")
    is_final: bool = Field(default=False, description="Is this the final chunk")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Chunk metadata")


class WebSocketMessage(BaseModel):
    """WebSocket message wrapper"""

    type: Literal[
        "connection_ack",
        "ping",
        "pong",
        "message",
        "typing",
        "stream",
        "error",
        "disconnect",
    ] = Field(..., description="Message type")
    data: Optional[Dict[str, Any]] = Field(None, description="Message payload")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Message timestamp")

    @validator("timestamp")
    def validate_timestamp(cls, v):
        """Validate ISO 8601 timestamp"""
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Invalid ISO 8601 timestamp")
        return v


class ErrorResponse(BaseModel):
    """Error response"""

    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Error timestamp")


class HealthCheckResponse(BaseModel):
    """Health check response"""

    status: Literal["ok", "degraded", "error"] = Field(..., description="Service status")
    version: str = Field(..., description="Service version")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Check timestamp")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional health details")


class SessionInfo(BaseModel):
    """Session information"""

    session_id: str = Field(..., description="Session identifier")
    agent_id: str = Field(..., description="Associated agent ID")
    created_at: str = Field(..., description="Session creation timestamp")
    last_activity: str = Field(..., description="Last activity timestamp")
    message_count: int = Field(default=0, description="Number of messages in session")
    context: Optional[Dict[str, Any]] = Field(None, description="Session context")
