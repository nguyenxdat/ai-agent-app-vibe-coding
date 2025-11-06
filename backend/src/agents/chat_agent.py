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
        selected_model: Optional[str] = None,
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
            selected_model: Selected model for OpenAI-compatible APIs
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
        self.selected_model = selected_model
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

    async def send_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        messages: Optional[list] = None,
    ) -> str:
        """
        Send message to agent and get text response
        Supports both A2A protocol and OpenAI-compatible APIs (including LiteLLM)

        Args:
            message: User message content
            context: Optional context information
            session_id: Session identifier
            messages: Optional conversation history in OpenAI format [{"role": "user/assistant", "content": "..."}]

        Returns:
            Agent response text
        """
        import logging
        logger = logging.getLogger(__name__)

        if not self.client:
            await self.initialize()

        logger.info(f"[ChatAgent] Sending message to agent {self.name} ({self.endpoint_url})")
        logger.info(f"[ChatAgent] Message: {message[:100]}...")
        if messages:
            logger.info(f"[ChatAgent] Conversation history: {len(messages)} messages")

        # Try A2A protocol first
        try:
            payload = {
                "message": message,
                "session_id": session_id,
                "context": context or {},
                "timestamp": datetime.utcnow().isoformat(),
            }

            a2a_url = f"{self.endpoint_url}/api/v1/chat"
            logger.info(f"[ChatAgent] Trying A2A protocol: POST {a2a_url}")

            response = await self.client.post(a2a_url, json=payload)
            response.raise_for_status()
            data = response.json()

            logger.info(f"[ChatAgent] A2A Success! Response: {str(data)[:200]}")
            return data.get("content", data.get("message", ""))

        except httpx.HTTPStatusError as e:
            logger.warning(f"[ChatAgent] A2A failed with {e.response.status_code}: {e.response.text[:200]}")

            # If A2A fails, try OpenAI-compatible format (LiteLLM, OpenAI, etc.)
            if e.response.status_code in [404, 405]:
                return await self._send_openai_compatible(message, logger, messages)

            raise Exception(f"Agent returned error: {e.response.status_code}")

        except Exception as e:
            logger.error(f"[ChatAgent] Unexpected error: {str(e)}")
            raise Exception(f"Failed to communicate with agent: {str(e)}")

    async def _send_openai_compatible(self, message: str, logger, messages: Optional[list] = None) -> str:
        """
        Send message using OpenAI SDK (works with LiteLLM for all models)
        LiteLLM proxy handles conversion for Gemini, Claude, etc.

        Args:
            message: Current user message
            logger: Logger instance
            messages: Optional conversation history
        """
        # Use selected model or fallback to default
        model = self.selected_model or "nal/gemini"

        # Use OpenAI SDK for all models (LiteLLM handles the conversion)
        return await self._send_via_openai(message, model, logger, messages)

    async def _send_via_gemini(self, message: str, model: str, logger) -> str:
        """Send message using Gemini SDK (for LiteLLM proxy with Gemini)"""
        from .gemini_agent import GeminiAgent

        logger.info(f"[ChatAgent] Using Gemini SDK with model: {model}")

        try:
            # Create temporary GeminiAgent instance
            gemini_agent = GeminiAgent(
                agent_id=self.id,
                name=self.name,
                endpoint_url=self.endpoint_url,
                api_key=self.auth_token or "dummy-key",
                model=model,
                timeout=self.timeout,
            )

            await gemini_agent.initialize()
            response = await gemini_agent.send_message(message)
            await gemini_agent.cleanup()

            return response

        except Exception as gemini_error:
            logger.error(f"[ChatAgent] Gemini SDK error: {str(gemini_error)}")
            raise Exception(f"Gemini API failed: {str(gemini_error)}")

    async def _send_via_openai(self, message: str, model: str, logger, messages: Optional[list] = None) -> str:
        """Send message using OpenAI SDK with fallback from chat/completions to completions"""
        from openai import AsyncOpenAI, NotFoundError

        # OpenAI SDK appends /chat/completions or /completions to base_url
        # So we need base_url to end with /v1 for LiteLLM compatibility
        base_url = f"{self.endpoint_url}/v1"

        logger.info(f"[ChatAgent] Using OpenAI-compatible API with model: {model}")
        logger.info(f"[ChatAgent] Base URL: {base_url}")

        # Create OpenAI client pointing to LiteLLM/OpenAI endpoint
        openai_client = AsyncOpenAI(
            base_url=base_url,
            api_key=self.auth_token or "dummy-key",
            timeout=self.timeout,
        )

        # Build messages array with history
        if messages:
            # Use provided conversation history + current message
            chat_messages = messages + [{"role": "user", "content": message}]
        else:
            # Single message without history
            chat_messages = [{"role": "user", "content": message}]

        # Try chat.completions first (modern API)
        try:
            logger.info(f"[ChatAgent] Trying chat.completions.create...")

            completion = await openai_client.chat.completions.create(
                model=model,
                messages=chat_messages,
            )

            logger.info(f"[ChatAgent] chat.completions SUCCESS!")

            # Extract response
            if completion.choices and len(completion.choices) > 0:
                content = completion.choices[0].message.content
                logger.info(f"[ChatAgent] Response: {content[:100] if content else 'EMPTY'}...")
                return content or ""

            logger.warning("[ChatAgent] No choices in response")
            return ""

        except NotFoundError:
            # 404 means endpoint not supported, fallback to legacy completions
            logger.warning(f"[ChatAgent] chat.completions not supported (404), falling back to completions API...")

            try:
                logger.info(f"[ChatAgent] Trying completions.create (legacy)...")

                # For legacy completions, concatenate conversation history into a single prompt
                if messages:
                    conversation_text = "\n".join([
                        f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                        for msg in messages
                    ])
                    full_prompt = f"{conversation_text}\nUser: {message}\nAssistant:"
                else:
                    full_prompt = message

                completion = await openai_client.completions.create(
                    model=model,
                    prompt=full_prompt,
                    max_tokens=1024,
                )

                logger.info(f"[ChatAgent] completions SUCCESS!")

                # Extract response from legacy format
                if completion.choices and len(completion.choices) > 0:
                    content = completion.choices[0].text
                    logger.info(f"[ChatAgent] Response: {content[:100] if content else 'EMPTY'}...")
                    return content or ""

                logger.warning("[ChatAgent] No choices in completions response")
                return ""

            except Exception as completions_error:
                logger.error(f"[ChatAgent] completions API also failed: {str(completions_error)}")
                raise Exception(f"Both chat/completions and completions endpoints failed. Last error: {str(completions_error)}")

        except Exception as openai_error:
            logger.error(f"[ChatAgent] OpenAI SDK error: {str(openai_error)}")
            raise Exception(f"OpenAI-compatible API failed: {str(openai_error)}")

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
