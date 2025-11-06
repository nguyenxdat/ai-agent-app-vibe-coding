"""
Gemini Agent Implementation
Handles chat conversations using Google Generative AI SDK
Works with LiteLLM proxy or direct Google AI
"""

from typing import Any, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GeminiAgent:
    """
    Gemini agent that communicates using Google GenAI SDK
    Compatible with LiteLLM proxy
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        endpoint_url: str,
        api_key: str,
        model: str = "gemini-pro",
        timeout: int = 30,
    ):
        """
        Initialize Gemini agent

        Args:
            agent_id: Unique agent identifier
            name: Agent name
            endpoint_url: LiteLLM proxy URL or Google AI endpoint
            api_key: API key for authentication
            model: Model name (e.g., "nal/gemini", "gemini-pro")
            timeout: Request timeout in seconds
        """
        self.id = agent_id
        self.name = name
        self.endpoint_url = endpoint_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.client = None

    async def initialize(self) -> None:
        """Initialize Google GenAI client"""
        try:
            import google.generativeai as genai

            # Configure with API key
            genai.configure(api_key=self.api_key)

            # For LiteLLM proxy, we need to use custom base URL
            # Google SDK doesn't directly support custom base URLs in the same way
            # We'll use the REST API approach instead

            logger.info(f"[GeminiAgent] Initialized with endpoint: {self.endpoint_url}")

        except ImportError as e:
            logger.error(f"[GeminiAgent] Failed to import google.generativeai: {e}")
            raise Exception("google-generativeai package not installed")

    async def send_message(self, message: str) -> str:
        """
        Send message to Gemini via LiteLLM proxy or direct API

        Args:
            message: User message content

        Returns:
            Agent response text
        """
        import httpx

        logger.info(f"[GeminiAgent] Sending message to {self.name}")
        logger.info(f"[GeminiAgent] Model: {self.model}")
        logger.info(f"[GeminiAgent] Message: {message[:100]}...")

        # Since LiteLLM proxy uses OpenAI-compatible format,
        # we'll use direct HTTP requests with Google GenAI format
        # LiteLLM should handle the conversion

        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            }

            # Try Google AI REST API format
            # LiteLLM proxy should support this
            payload = {
                "contents": [{
                    "parts": [{
                        "text": message
                    }]
                }]
            }

            # Construct URL for generateContent endpoint
            # Format: https://llm.nal.vn/v1beta/models/{model}:generateContent
            url = f"{self.endpoint_url}/v1beta/models/{self.model}:generateContent"

            logger.info(f"[GeminiAgent] Calling: POST {url}")

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)

                logger.info(f"[GeminiAgent] Response status: {response.status_code}")

                response.raise_for_status()
                data = response.json()

                logger.info(f"[GeminiAgent] Response data: {str(data)[:200]}")

                # Extract content from Gemini response format
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate:
                        parts = candidate["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            content = parts[0]["text"]
                            logger.info(f"[GeminiAgent] Extracted content: {content[:100]}...")
                            return content

                logger.warning("[GeminiAgent] No content in response")
                return ""

        except httpx.HTTPStatusError as e:
            logger.error(f"[GeminiAgent] HTTP error {e.response.status_code}: {e.response.text[:200]}")
            raise Exception(f"Gemini API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"[GeminiAgent] Error: {str(e)}")
            raise Exception(f"Failed to communicate with Gemini: {str(e)}")

    async def cleanup(self) -> None:
        """Cleanup resources"""
        pass  # No persistent connection to cleanup
