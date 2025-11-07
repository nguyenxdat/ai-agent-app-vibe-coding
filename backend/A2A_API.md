# A2A Protocol API Documentation

## Overview

The A2A (Agent-to-Agent) Protocol API provides endpoints for external applications and agents to communicate with the AI Chat Agent.

**Base URL**: `http://localhost:8000/api/v1/a2a`

**Protocol Version**: 1.0.0

## Authentication

Authentication is **optional** and controlled by the `A2A_API_KEY` environment variable:

- **If `A2A_API_KEY` is NOT set**: All A2A endpoints are publicly accessible without authentication
- **If `A2A_API_KEY` is set**: Protected endpoints require Bearer token authentication

### Setting up Authentication

1. Set the API key in your environment:
   ```bash
   export A2A_API_KEY="your-secret-api-key-here"
   ```

2. Or add to `.env` file:
   ```
   A2A_API_KEY=your-secret-api-key-here
   ```

### Making Authenticated Requests

Include the API key in the `Authorization` header:

```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -d '{"content": "Hello!", "format": "plain"}'
```

### Authentication Status

Check if authentication is required by calling the Agent Card endpoint:

```bash
curl http://localhost:8000/api/v1/a2a/agent-card
```

The response includes:
```json
{
  "metadata": {
    "authentication": {
      "required": false,  // or true if A2A_API_KEY is set
      "methods": ["bearer"]
    }
  }
}
```

## Endpoints

### 1. Get Agent Card

**GET** `/api/v1/a2a/agent-card`

Returns agent metadata, capabilities, and configuration.

**Authentication**: Not required (always public)

**Response**:
```json
{
  "id": "ai-chat-agent-001",
  "name": "AI Chat Agent",
  "description": "AI Chat Agent with A2A protocol support...",
  "capabilities": [
    "chat",
    "websocket",
    "markdown",
    "code",
    "session-management",
    "typing-indicator",
    "message-history"
  ],
  "protocol_version": "1.0.0",
  "created_at": "2025-11-07T03:03:37.717001",
  "metadata": {
    "endpoints": {
      "agent_card": "/api/v1/a2a/agent-card",
      "message": "/api/v1/a2a/message",
      "websocket": "/ws",
      "health": "/api/v1/health"
    },
    "authentication": {
      "required": false,
      "methods": ["bearer"]
    },
    "rate_limits": {
      "messages_per_minute": 60,
      "concurrent_sessions": 100
    },
    "supported_formats": ["plain", "markdown", "code"],
    "streaming": true,
    "version": "1.0.0"
  }
}
```

### 2. Send Message

**POST** `/api/v1/a2a/message`

Send a message to the agent and receive a response.

**Authentication**: Required if `A2A_API_KEY` is set

**Request Body**:
```json
{
  "content": "Your message here",
  "format": "plain",  // "plain" | "markdown" | "code"
  "session_id": "optional-session-id",  // Optional: for conversation context
  "context": {},  // Optional: additional context
  "stream": false  // Streaming not yet supported
}
```

**Response**:
```json
{
  "message_id": "b5ed00d6-5ef8-4748-992c-c0f25d58db48",
  "content": "Agent response here",
  "format": "plain",
  "timestamp": "2025-11-07T03:05:00.078611",
  "metadata": {
    "session_id": "1bdad206-90b2-4609-852c-13db74e82298",
    "agent_id": "ai-chat-agent-001",
    "agent_name": "AI Chat Agent",
    "model": "echo-agent-v1"
  }
}
```

**Example - Plain Text**:
```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello!",
    "format": "plain"
  }'
```

**Example - Request Code**:
```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Show me a code example",
    "format": "plain"
  }'
```

Response:
```json
{
  "content": "```python\n# Code example here\n```",
  "format": "code",
  "metadata": {
    "language": "python"
  }
}
```

**Example - With Session**:
```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Continue our conversation",
    "format": "plain",
    "session_id": "my-session-123"
  }'
```

**Example - Authenticated Request**:
```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -d '{
    "content": "Hello!",
    "format": "plain"
  }'
```

### 3. Health Check

**GET** `/api/v1/a2a/health`

Check A2A service status.

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok",
  "protocol": "A2A",
  "version": "1.0.0",
  "agent_id": "ai-chat-agent-001",
  "active_sessions": 4
}
```

## Message Formats

### Plain Text
```json
{
  "content": "Simple text message",
  "format": "plain"
}
```

### Markdown
```json
{
  "content": "**Bold** and *italic* text with [links](https://example.com)",
  "format": "markdown"
}
```

### Code
```json
{
  "content": "def hello():\n    print('Hello!')",
  "format": "code",
  "metadata": {
    "language": "python"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Message content cannot be empty"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication required. Please provide a Bearer token."
}
```

or

```json
{
  "detail": "Invalid authentication token"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to process message: <error details>"
}
```

## Rate Limits

- **Messages per minute**: 60
- **Concurrent sessions**: 100

Rate limiting is not yet enforced but clients should respect these limits.

## Session Management

Sessions maintain conversation context across multiple messages:

1. **Auto-create**: If no `session_id` is provided, one is created automatically
2. **Reuse**: Include the same `session_id` in subsequent requests to maintain context
3. **Expiry**: Sessions are kept in memory and will be lost on server restart

Example session flow:
```bash
# First message - creates new session
curl -X POST .../message -d '{"content": "Hello"}'
# Response includes: "metadata": {"session_id": "abc-123"}

# Continue conversation with same session
curl -X POST .../message -d '{
  "content": "Continue",
  "session_id": "abc-123"
}'
```

## Best Practices

1. **Check Agent Card First**: Always call `/agent-card` to discover capabilities and authentication requirements
2. **Reuse Sessions**: Use session IDs to maintain conversation context
3. **Handle Errors**: Implement proper error handling for 401, 400, and 500 responses
4. **Respect Rate Limits**: Implement client-side rate limiting
5. **Secure API Keys**: Never commit API keys to version control

## Example Integration

```python
import httpx

class A2AClient:
    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
        self.session_id = None

    async def get_agent_card(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/agent-card")
            return response.json()

    async def send_message(self, content: str, format: str = "plain"):
        payload = {
            "content": content,
            "format": format
        }
        if self.session_id:
            payload["session_id"] = self.session_id

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/message",
                json=payload,
                headers=self.headers
            )
            data = response.json()

            # Save session ID for future requests
            if not self.session_id:
                self.session_id = data["metadata"]["session_id"]

            return data

# Usage
client = A2AClient("http://localhost:8000/api/v1/a2a", api_key="your-key")
response = await client.send_message("Hello!")
print(response["content"])
```

## Interactive API Documentation

FastAPI provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

These interfaces allow you to explore and test the API directly in your browser.
