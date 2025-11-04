"""
Base Agent Class
Provides foundation for all AI agents
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents
    Implements A2A protocol requirements
    """

    def __init__(
        self,
        agent_id: Optional[str] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        capabilities: Optional[List[str]] = None,
    ):
        """
        Initialize base agent

        Args:
            agent_id: Unique agent identifier (auto-generated if not provided)
            name: Human-readable agent name
            description: Agent description
            capabilities: List of agent capabilities
        """
        self.id = agent_id or str(uuid.uuid4())
        self.name = name or self.__class__.__name__
        self.description = description or f"Agent: {self.name}"
        self.capabilities = capabilities or []
        self.created_at = datetime.utcnow().isoformat()
        self.metadata: Dict[str, Any] = {}

    @abstractmethod
    async def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process incoming message and generate response

        Args:
            message: User message content
            context: Optional context information
            session_id: Session identifier for conversation continuity

        Returns:
            Dict containing response and metadata
            {
                "content": str,
                "format": "plain" | "markdown" | "code",
                "metadata": Dict[str, Any]
            }
        """
        pass

    @abstractmethod
    async def stream_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ):
        """
        Stream response in chunks (async generator)

        Args:
            message: User message content
            context: Optional context information
            session_id: Session identifier

        Yields:
            Response chunks
        """
        pass

    def get_agent_card(self) -> Dict[str, Any]:
        """
        Get agent card information (A2A protocol)

        Returns:
            Agent card data
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "protocol_version": "1.0.0",
            "created_at": self.created_at,
            "metadata": self.metadata,
        }

    async def initialize(self) -> None:
        """
        Initialize agent resources
        Override this method to setup connections, load models, etc.
        """
        pass

    async def cleanup(self) -> None:
        """
        Cleanup agent resources
        Override this method to close connections, release resources, etc.
        """
        pass

    def add_capability(self, capability: str) -> None:
        """Add capability to agent"""
        if capability not in self.capabilities:
            self.capabilities.append(capability)

    def remove_capability(self, capability: str) -> None:
        """Remove capability from agent"""
        if capability in self.capabilities:
            self.capabilities.remove(capability)

    def has_capability(self, capability: str) -> bool:
        """Check if agent has specific capability"""
        return capability in self.capabilities

    def update_metadata(self, key: str, value: Any) -> None:
        """Update agent metadata"""
        self.metadata[key] = value

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id}, name={self.name})>"
