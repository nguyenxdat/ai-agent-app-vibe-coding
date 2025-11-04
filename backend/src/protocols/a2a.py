"""
A2A Protocol Handler
Implements Agent-to-Agent communication protocol
"""

from typing import Any, Dict, Optional
from datetime import datetime
import uuid
import logging

from .schemas import (
    AgentCard,
    MessageRequest,
    MessageResponse,
    StreamChunk,
    ErrorResponse,
)

logger = logging.getLogger(__name__)


class A2AProtocolHandler:
    """
    A2A Protocol implementation
    Handles protocol-level operations and validation
    """

    PROTOCOL_VERSION = "1.0.0"

    def __init__(self, agent_id: str, agent_name: str):
        """
        Initialize protocol handler

        Args:
            agent_id: Agent identifier
            agent_name: Agent name
        """
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, session_id: Optional[str] = None) -> str:
        """
        Create new session

        Args:
            session_id: Optional session ID (auto-generated if not provided)

        Returns:
            Session ID
        """
        session_id = session_id or str(uuid.uuid4())

        if session_id in self.sessions:
            logger.warning(f"Session {session_id} already exists")
            return session_id

        self.sessions[session_id] = {
            "id": session_id,
            "agent_id": self.agent_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "message_count": 0,
            "context": {},
        }

        logger.info(f"Created session {session_id}")
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        return self.sessions.get(session_id)

    def update_session_activity(self, session_id: str) -> None:
        """Update session last activity timestamp"""
        if session_id in self.sessions:
            self.sessions[session_id]["last_activity"] = datetime.utcnow().isoformat()
            self.sessions[session_id]["message_count"] += 1

    def delete_session(self, session_id: str) -> bool:
        """
        Delete session

        Returns:
            True if session was deleted, False if not found
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Deleted session {session_id}")
            return True
        return False

    def create_message_response(
        self,
        content: str,
        format: str = "plain",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MessageResponse:
        """
        Create message response

        Args:
            content: Response content
            format: Content format (plain, markdown, code)
            metadata: Optional metadata

        Returns:
            MessageResponse object
        """
        return MessageResponse(
            message_id=str(uuid.uuid4()),
            content=content,
            format=format,
            timestamp=datetime.utcnow().isoformat(),
            metadata=metadata or {},
        )

    def create_stream_chunk(
        self,
        chunk_id: int,
        content: str,
        is_final: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> StreamChunk:
        """
        Create stream chunk

        Args:
            chunk_id: Chunk sequence number
            content: Chunk content
            is_final: Is this the final chunk
            metadata: Optional metadata

        Returns:
            StreamChunk object
        """
        return StreamChunk(
            chunk_id=chunk_id,
            content=content,
            is_final=is_final,
            metadata=metadata or {},
        )

    def create_error_response(
        self,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> ErrorResponse:
        """
        Create error response

        Args:
            error_code: Error code
            message: Error message
            details: Optional error details

        Returns:
            ErrorResponse object
        """
        return ErrorResponse(
            error_code=error_code,
            message=message,
            details=details or {},
            timestamp=datetime.utcnow().isoformat(),
        )

    def validate_message_request(self, request: MessageRequest) -> bool:
        """
        Validate message request

        Args:
            request: Message request to validate

        Returns:
            True if valid

        Raises:
            ValueError: If validation fails
        """
        if not request.content or not request.content.strip():
            raise ValueError("Message content cannot be empty")

        if request.format not in ["plain", "markdown", "code"]:
            raise ValueError(f"Invalid format: {request.format}")

        return True

    def get_protocol_version(self) -> str:
        """Get protocol version"""
        return self.PROTOCOL_VERSION

    def create_agent_card(
        self,
        description: str,
        capabilities: list,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AgentCard:
        """
        Create agent card

        Args:
            description: Agent description
            capabilities: List of capabilities
            metadata: Optional metadata

        Returns:
            AgentCard object
        """
        return AgentCard(
            id=self.agent_id,
            name=self.agent_name,
            description=description,
            capabilities=capabilities,
            protocol_version=self.PROTOCOL_VERSION,
            created_at=datetime.utcnow().isoformat(),
            metadata=metadata or {},
        )

    def __repr__(self) -> str:
        return f"<A2AProtocolHandler(agent_id={self.agent_id}, sessions={len(self.sessions)})>"
