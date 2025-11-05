"""
Chat Agent Implementation
Handles chat conversations with A2A protocol agents
"""

from typing import Any, Dict, List, Optional, AsyncGenerator
from datetime import datetime
import httpx
import asyncio
from .base import BaseAgent


class ChatAgent(BaseAgent):
    """
    Chat agent that communicates with external A2A agents
    Manages message flow and conversation state
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        endpoint_url: str,
        auth_token: Optional[str] = None,
        description: Optional[str] = None,
        capabilities: Optional[List[str]] = None,
        timeout: int = 30,
    ):
        """
        Initialize chat agent

        Args:
            agent_id: Unique agent identifier
            name: Agent name
            endpoint_url: A2A protocol endpoint URL
            auth_token: Optional authentication token
            description: Agent description
            capabilities: List of agent capabilities
            timeout: Request timeout in seconds
        """
        super().__init__(
            agent_id=agent_id,
            name=name,
            description=description,
            capabilities=capabilities or ["chat", "text-generation"],
        )
        self.endpoint_url = endpoint_url.rstrip("/")
        self.auth_token = auth_token
        self.timeout = timeout
        self.client: Optional[httpx.AsyncClient] = None

    async def initialize(self) -> None:
        """Initialize HTTP client"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            headers=headers,
            follow_redirects=True,
        )

    async def cleanup(self) -> None:
        """Cleanup HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None

    async def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process message and get response from A2A agent

        Args:
            message: User message content
            context: Optional context information
            session_id: Session identifier

        Returns:
            Response dictionary with content and metadata
        """
        if not self.client:
            await self.initialize()

        try:
            # Prepare request payload (A2A protocol format)
            payload = {
                "message": message,
                "session_id": session_id,
                "context": context or {},
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Send request to A2A agent
            response = await self.client.post(
                f"{self.endpoint_url}/api/v1/chat",
                json=payload,
            )

            response.raise_for_status()
            data = response.json()

            return {
                "content": data.get("content", data.get("message", "")),
                "format": data.get("format", "plain"),
                "metadata": {
                    "agent_id": self.id,
                    "agent_name": self.name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "session_id": session_id,
                    **data.get("metadata", {}),
                },
            }

        except httpx.HTTPStatusError as e:
            error_msg = f"Agent returned error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg = error_data.get("detail", error_data.get("error", error_msg))
            except Exception:
                pass

            return {
                "content": "",
                "format": "plain",
                "metadata": {
                    "error": error_msg,
                    "status": "error",
                },
            }

        except httpx.TimeoutException:
            return {
                "content": "",
                "format": "plain",
                "metadata": {
                    "error": f"Request timeout after {self.timeout}s",
                    "status": "error",
                },
            }

        except Exception as e:
            return {
                "content": "",
                "format": "plain",
                "metadata": {
                    "error": f"Failed to communicate with agent: {str(e)}",
                    "status": "error",
                },
            }

    async def stream_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream response from A2A agent (if supported)

        Args:
            message: User message content
            context: Optional context information
            session_id: Session identifier

        Yields:
            Response chunks
        """
        if not self.client:
            await self.initialize()

        try:
            # Prepare request payload
            payload = {
                "message": message,
                "session_id": session_id,
                "context": context or {},
                "stream": True,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Try streaming endpoint first
            async with self.client.stream(
                "POST",
                f"{self.endpoint_url}/api/v1/chat/stream",
                json=payload,
            ) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                import json

                                data = json.loads(line)
                                yield {
                                    "content": data.get("content", ""),
                                    "format": data.get("format", "plain"),
                                    "done": data.get("done", False),
                                    "metadata": data.get("metadata", {}),
                                }
                            except json.JSONDecodeError:
                                # Skip invalid JSON lines
                                continue
                else:
                    # Fallback to non-streaming
                    result = await self.process_message(message, context, session_id)
                    yield result

        except Exception:
            # Fallback to non-streaming
            result = await self.process_message(message, context, session_id)
            yield result

    async def validate_connection(self) -> Dict[str, Any]:
        """
        Validate connection to agent endpoint
        Supports both A2A protocol and OpenAI-compatible APIs (LiteLLM, etc.)

        Returns:
            Validation result with status and latency
        """
        if not self.client:
            await self.initialize()

        start_time = datetime.utcnow()

        # Try A2A protocol first
        try:
            response = await self.client.get(f"{self.endpoint_url}/api/v1/agent/card")
            response.raise_for_status()

            latency = (datetime.utcnow() - start_time).total_seconds() * 1000
            agent_card = response.json()

            return {
                "valid": True,
                "message": "Connection successful (A2A protocol)",
                "latency": round(latency, 2),
                "agent_card": agent_card,
            }

        except httpx.HTTPStatusError as e:
            # If A2A fails with 404, try OpenAI-compatible format
            if e.response.status_code == 404:
                try:
                    # Try to get models list (OpenAI/LiteLLM format)
                    response = await self.client.get(f"{self.endpoint_url}/models")
                    response.raise_for_status()

                    latency = (datetime.utcnow() - start_time).total_seconds() * 1000
                    models_data = response.json()

                    return {
                        "valid": True,
                        "message": "Connection successful (OpenAI-compatible API)",
                        "latency": round(latency, 2),
                        "agent_card": {
                            "type": "openai-compatible",
                            "models": models_data.get("data", [])[:5],  # First 5 models
                        },
                    }

                except Exception:
                    pass

            return {
                "valid": False,
                "message": f"HTTP {e.response.status_code}: {e.response.text[:100]}",
                "latency": None,
            }

        except httpx.TimeoutException:
            return {
                "valid": False,
                "message": f"Connection timeout after {self.timeout}s",
                "latency": None,
            }

        except Exception as e:
            return {
                "valid": False,
                "message": f"Connection failed: {str(e)}",
                "latency": None,
            }
