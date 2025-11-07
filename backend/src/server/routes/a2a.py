"""
A2A Protocol API Routes
Provides Agent-to-Agent communication endpoints
"""

from fastapi import APIRouter, HTTPException, Header, Request, Depends
from typing import Optional
import logging

from ...protocols.schemas import (
    AgentCard,
    MessageRequest,
    MessageResponse,
    ErrorResponse,
)
from ...protocols.a2a import A2AProtocolHandler
from ..middleware.auth import verify_a2a_token, is_auth_enabled

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/v1/a2a",
    tags=["A2A Protocol"],
)

# Initialize A2A protocol handler with default agent
# This would typically be configured from environment or database
a2a_handler = A2AProtocolHandler(
    agent_id="ai-chat-agent-001",
    agent_name="AI Chat Agent"
)


@router.get(
    "/agent-card",
    response_model=AgentCard,
    summary="Get Agent Card",
    description="Returns the agent card containing metadata, capabilities, and connection information"
)
async def get_agent_card() -> AgentCard:
    """
    Get Agent Card (T088)

    Returns agent metadata including:
    - Agent ID and name
    - Description
    - Capabilities list
    - Protocol version
    - Metadata (endpoints, authentication requirements)

    This endpoint is public and does not require authentication.
    """
    try:
        # Define agent capabilities
        capabilities = [
            "chat",  # Real-time chat communication
            "websocket",  # WebSocket support for streaming
            "markdown",  # Markdown message format
            "code",  # Code block format with syntax highlighting
            "session-management",  # Multi-session support
            "typing-indicator",  # Typing status broadcast
            "message-history",  # Persistent message history
        ]

        # Define metadata with endpoint information
        metadata = {
            "endpoints": {
                "agent_card": "/api/v1/a2a/agent-card",
                "message": "/api/v1/a2a/message",
                "websocket": "/ws",  # WebSocket endpoint
                "health": "/api/v1/health",
            },
            "authentication": {
                "required": is_auth_enabled(),  # Dynamic based on A2A_API_KEY
                "methods": ["bearer"],  # Supported auth methods
            },
            "rate_limits": {
                "messages_per_minute": 60,
                "concurrent_sessions": 100,
            },
            "supported_formats": ["plain", "markdown", "code"],
            "streaming": True,
            "version": "1.0.0",
        }

        # Create agent card using protocol handler
        agent_card = a2a_handler.create_agent_card(
            description="AI Chat Agent with A2A protocol support. Provides intelligent chat responses with support for rich message formats (markdown, code blocks) and real-time WebSocket communication.",
            capabilities=capabilities,
            metadata=metadata,
        )

        logger.info("Agent card requested and returned successfully")
        return agent_card

    except Exception as e:
        logger.error(f"Error generating agent card: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate agent card: {str(e)}"
        )


@router.post(
    "/message",
    response_model=MessageResponse,
    summary="Send Message to Agent",
    description="Send a message to the agent and receive a response (A2A protocol)",
    responses={
        200: {"description": "Message processed successfully"},
        400: {"description": "Invalid request"},
        401: {"description": "Authentication required"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error"},
    }
)
async def send_message(
    request: MessageRequest,
    authenticated: bool = Depends(verify_a2a_token),
) -> MessageResponse:
    """
    Send Message to Agent (T089)

    Processes a message according to A2A protocol and returns a response.

    Authentication:
    - If A2A_API_KEY is set in environment, Bearer token authentication is required
    - Include header: Authorization: Bearer <your-api-key>
    - If A2A_API_KEY is not set, authentication is disabled

    Request body:
    - content: Message content (required)
    - format: Message format (plain, markdown, code)
    - session_id: Optional session ID for context
    - context: Optional additional context
    - stream: Whether to enable streaming (not yet supported)

    Response:
    - message_id: Unique message identifier
    - content: Agent response content
    - format: Response format
    - timestamp: ISO 8601 timestamp
    - metadata: Additional response metadata
    """
    try:
        # Validate request
        a2a_handler.validate_message_request(request)

        # Authentication is handled by the Depends(verify_a2a_token) dependency
        logger.debug(f"Request authenticated: {authenticated}")

        # Handle session management
        session_id = request.session_id
        if not session_id:
            # Create new session if not provided
            session_id = a2a_handler.create_session()
            logger.info(f"Created new session: {session_id}")
        else:
            # Get or create session
            session = a2a_handler.get_session(session_id)
            if not session:
                session_id = a2a_handler.create_session(session_id)
                logger.info(f"Created session from provided ID: {session_id}")

        # Update session activity
        a2a_handler.update_session_activity(session_id)

        # Process the message
        # For now, we'll implement a simple echo agent with format detection
        # This can be replaced with actual LLM integration later

        response_content = _process_agent_message(request.content, request.format)

        # Auto-detect format if input was plain text
        response_format = request.format
        response_metadata = {}

        if request.format == "plain":
            # Check if response contains code or markdown
            if "```" in response_content:
                response_format = "code"
                # Extract language if present
                import re
                code_match = re.search(r'```(\w+)?', response_content)
                if code_match and code_match.group(1):
                    response_metadata["language"] = code_match.group(1)
            elif any(indicator in response_content for indicator in ["**", "##", "- ", "* ", "[", "]("]):
                response_format = "markdown"

        # Add metadata
        response_metadata.update({
            "session_id": session_id,
            "agent_id": a2a_handler.agent_id,
            "agent_name": a2a_handler.agent_name,
            "model": "echo-agent-v1",  # Placeholder
        })

        # Create response
        response = a2a_handler.create_message_response(
            content=response_content,
            format=response_format,
            metadata=response_metadata,
        )

        logger.info(f"Message processed successfully for session {session_id}")
        return response

    except ValueError as e:
        logger.warning(f"Invalid request: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )


def _process_agent_message(content: str, format: str) -> str:
    """
    Simple message processor (echo agent with enhancements)

    This is a placeholder implementation. In a real scenario, this would:
    - Call an LLM API (OpenAI, Anthropic, etc.)
    - Use the Gemini agent or other AI backends
    - Apply business logic and context

    For now, it returns an intelligent echo response.
    """
    # Simple intelligent responses for demo purposes
    content_lower = content.lower().strip()

    # Greetings
    if any(greeting in content_lower for greeting in ["hello", "hi", "hey", "greetings"]):
        return f"Hello! I'm the AI Chat Agent. I received your message: \"{content}\". How can I assist you today?"

    # Questions about capabilities
    if "what can you do" in content_lower or "capabilities" in content_lower:
        return """I'm an AI Chat Agent with the following capabilities:

- **Real-time chat**: WebSocket-based communication
- **Rich formatting**: Support for plain text, markdown, and code blocks
- **Session management**: Maintain conversation context
- **Multi-format responses**: Automatically detect and format responses

Ask me anything, and I'll do my best to help!"""

    # Code-related requests
    if "code" in content_lower and ("example" in content_lower or "show" in content_lower):
        return """```python
# Here's a simple Python example
def greet(name):
    return f"Hello, {name}!"

# Usage
message = greet("User")
print(message)
```"""

    # Default: Intelligent echo
    return f"I received your message: \"{content}\"\n\nI'm currently running in demo mode. In production, I would process this using an LLM and provide intelligent responses based on the agent's capabilities."


@router.get(
    "/health",
    summary="A2A Service Health Check",
    description="Check if the A2A service is running and ready to accept requests"
)
async def a2a_health_check():
    """
    A2A-specific health check endpoint

    Returns service status and protocol information.
    """
    return {
        "status": "ok",
        "protocol": "A2A",
        "version": a2a_handler.get_protocol_version(),
        "agent_id": a2a_handler.agent_id,
        "active_sessions": len(a2a_handler.sessions),
    }
