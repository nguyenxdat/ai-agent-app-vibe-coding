"""
Agent Configuration API Routes
CRUD endpoints for managing AI agent configurations
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl
import uuid
from datetime import datetime

# Import protocols
from ...protocols.schemas import AgentCard, ErrorResponse

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


# Pydantic models for requests/responses
class AgentConfigCreate(BaseModel):
    """Agent configuration create request"""

    name: str = Field(..., min_length=1, max_length=100, description="Agent name")
    endpointUrl: HttpUrl = Field(..., description="Agent A2A endpoint URL")
    authToken: str | None = Field(None, description="Optional authentication token")
    capabilities: List[str] = Field(default_factory=list, description="Agent capabilities")
    isActive: bool = Field(default=True, description="Whether agent is active")


class AgentConfigUpdate(BaseModel):
    """Agent configuration update request"""

    name: str | None = Field(None, min_length=1, max_length=100)
    endpointUrl: HttpUrl | None = None
    authToken: str | None = None
    capabilities: List[str] | None = None
    isActive: bool | None = None


class AgentConfigResponse(BaseModel):
    """Agent configuration response"""

    id: str
    name: str
    endpointUrl: str
    authToken: str | None
    capabilities: List[str]
    isActive: bool
    protocolVersion: str
    createdAt: str
    updatedAt: str
    lastUsedAt: str | None = None


class ValidateAgentRequest(BaseModel):
    """Validate agent endpoint request"""

    endpointUrl: HttpUrl


class ValidateAgentResponse(BaseModel):
    """Validate agent endpoint response"""

    valid: bool
    message: str
    latency: float | None = None
    agentCard: dict | None = None  # Changed from AgentCard to dict for flexibility


# In-memory storage (will be replaced with database later)
agents_db: dict[str, AgentConfigResponse] = {}


@router.get(
    "",
    response_model=List[AgentConfigResponse],
    summary="Get all agent configurations",
    description="Retrieve all configured AI agents",
)
async def get_agents():
    """Get all agent configurations"""
    return list(agents_db.values())


@router.post(
    "",
    response_model=AgentConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create agent configuration",
    description="Add a new AI agent configuration",
)
async def create_agent(agent: AgentConfigCreate):
    """Create a new agent configuration"""

    # Check for duplicate name
    for existing_agent in agents_db.values():
        if existing_agent.name == agent.name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Agent with name '{agent.name}' already exists",
            )

    # Create new agent
    agent_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    new_agent = AgentConfigResponse(
        id=agent_id,
        name=agent.name,
        endpointUrl=str(agent.endpointUrl),
        authToken=agent.authToken,
        capabilities=agent.capabilities,
        isActive=agent.isActive,
        protocolVersion="1.0.0",
        createdAt=now,
        updatedAt=now,
        lastUsedAt=None,
    )

    agents_db[agent_id] = new_agent
    return new_agent


@router.get(
    "/{agent_id}",
    response_model=AgentConfigResponse,
    summary="Get agent by ID",
    description="Retrieve a specific agent configuration",
)
async def get_agent(agent_id: str):
    """Get agent configuration by ID"""

    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    return agents_db[agent_id]


@router.put(
    "/{agent_id}",
    response_model=AgentConfigResponse,
    summary="Update agent configuration",
    description="Update an existing agent configuration",
)
async def update_agent(agent_id: str, updates: AgentConfigUpdate):
    """Update agent configuration"""

    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    agent = agents_db[agent_id]

    # Check name uniqueness if updating name
    if updates.name and updates.name != agent.name:
        for existing_agent in agents_db.values():
            if existing_agent.name == updates.name:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Agent with name '{updates.name}' already exists",
                )

    # Update fields
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "endpointUrl" and value:
            setattr(agent, field, str(value))
        else:
            setattr(agent, field, value)

    agent.updatedAt = datetime.utcnow().isoformat()
    agents_db[agent_id] = agent

    return agent


@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete agent configuration",
    description="Remove an agent configuration",
)
async def delete_agent(agent_id: str):
    """Delete agent configuration"""

    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    del agents_db[agent_id]
    return None


@router.post(
    "/{agent_id}/validate",
    response_model=ValidateAgentResponse,
    summary="Validate agent endpoint",
    description="Test connectivity to an agent's endpoint (supports both A2A and OpenAI-compatible APIs)",
)
async def validate_agent_endpoint(agent_id: str):
    """Validate agent endpoint accessibility"""

    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    agent = agents_db[agent_id]

    # Use ChatAgent class for validation
    try:
        from ...agents.chat_agent import ChatAgent

        # Create ChatAgent instance
        chat_agent = ChatAgent(
            agent_id=agent.id,
            name=agent.name,
            endpoint_url=agent.endpointUrl,
            auth_token=agent.authToken,
            capabilities=agent.capabilities,
        )

        # Validate connection
        result = await chat_agent.validate_connection()

        # Cleanup
        await chat_agent.cleanup()

        # Convert agent_card to AgentCard if available
        agent_card = None
        if result.get("valid") and result.get("agent_card"):
            try:
                agent_card_data = result["agent_card"]
                # For OpenAI-compatible APIs, create a simple agent card
                if agent_card_data.get("type") == "openai-compatible":
                    agent_card = {
                        "name": agent.name,
                        "version": "1.0.0",
                        "description": "OpenAI-compatible API",
                        "capabilities": ["chat", "completions"],
                        "endpointUrl": agent.endpointUrl,
                        "authRequirements": {"type": "bearer"},
                        "protocolVersion": "openai-v1",
                    }
                else:
                    agent_card = AgentCard(**agent_card_data)
            except Exception:
                # If AgentCard parsing fails, just pass None
                pass

        return ValidateAgentResponse(
            valid=result.get("valid", False),
            message=result.get("message", "Unknown error"),
            latency=result.get("latency"),
            agentCard=agent_card,
        )

    except Exception as e:
        return ValidateAgentResponse(
            valid=False,
            message=f"Validation error: {str(e)}",
            latency=None,
        )


@router.post(
    "/validate",
    response_model=ValidateAgentResponse,
    summary="Validate agent URL",
    description="Test connectivity to an agent endpoint URL before creating config",
)
async def validate_agent_url(request: ValidateAgentRequest):
    """Validate agent endpoint URL accessibility"""

    try:
        import httpx
        import time

        start_time = time.time()

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    f"{request.endpointUrl}/api/v1/a2a/agent-card",
                )

                latency = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    agent_card_data = response.json()
                    agent_card = AgentCard(**agent_card_data)

                    return ValidateAgentResponse(
                        valid=True,
                        message="Agent endpoint accessible",
                        latency=latency,
                        agentCard=agent_card,
                    )
                else:
                    return ValidateAgentResponse(
                        valid=False,
                        message=f"HTTP {response.status_code}: {response.text}",
                        latency=latency,
                    )

            except httpx.TimeoutException:
                latency = int((time.time() - start_time) * 1000)
                return ValidateAgentResponse(
                    valid=False,
                    message="Connection timeout",
                    latency=latency,
                )

            except Exception as e:
                latency = int((time.time() - start_time) * 1000)
                return ValidateAgentResponse(
                    valid=False,
                    message=f"Connection error: {str(e)}",
                    latency=latency,
                )

    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="httpx library not available",
        )
