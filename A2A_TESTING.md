# A2A Protocol Testing Guide

Guide để test A2A (Agent-to-Agent) protocol endpoints.

---

## Prerequisites

1. **Backend Server Running**:
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python -m src.server.app
   ```

2. **Server accessible at**: http://localhost:8000

---

## Quick Test

### Test với Python

```bash
cd backend
python test_a2a_client.py
```

### Test với TypeScript/Node.js

```bash
npx ts-node test_a2a_client.ts
```

---

## Test Cases

### T099: Get Agent Card ✅

**Endpoint**: `GET /api/v1/a2a/agent-card`

**Purpose**: Retrieve agent metadata, capabilities, and connection info

**Test**:
```bash
# Python
python test_a2a_client.py

# cURL
curl http://localhost:8000/api/v1/a2a/agent-card

# JavaScript/Browser
fetch('http://localhost:8000/api/v1/a2a/agent-card')
  .then(res => res.json())
  .then(card => console.log(card))
```

**Expected Response**:
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
  "metadata": {
    "endpoints": {
      "agent_card": "http://localhost:8000/api/v1/a2a/agent-card",
      "message": "http://localhost:8000/api/v1/a2a/message",
      "websocket": "ws://localhost:8000/ws",
      "health": "http://localhost:8000/api/v1/health"
    },
    "authentication": {
      "required": false,
      "methods": ["bearer"]
    }
  }
}
```

---

### T100: Send Message to Agent ✅

**Endpoint**: `POST /api/v1/a2a/message`

**Purpose**: Send message and receive agent response

**Test**:
```bash
# Python
python test_a2a_client.py

# cURL
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! How are you?",
    "format": "plain"
  }'

# With authentication
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "content": "Hello!",
    "format": "plain"
  }'
```

**Request Body**:
```json
{
  "content": "Hello! How are you?",
  "format": "plain",  // "plain", "markdown", or "code"
  "session_id": "optional-session-id",
  "context": {}  // optional context
}
```

**Expected Response**:
```json
{
  "message_id": "msg_abc123",
  "content": "I received your message: \"Hello! How are you?\"...",
  "format": "plain",
  "timestamp": "2025-11-07T10:30:00Z",
  "metadata": {
    "session_id": "session_xyz789",
    "agent_id": "ai-chat-agent-001",
    "agent_name": "AI Chat Agent"
  }
}
```

---

### T101: Validate Agent Card Compliance ✅

**Purpose**: Ensure agent card follows A2A protocol specification

**Required Fields**:
- `id` (string): Unique agent identifier
- `name` (string): Agent display name
- `description` (string): Agent description
- `capabilities` (array): List of agent capabilities
- `protocol_version` (string): A2A protocol version

**Optional but Recommended**:
- `metadata`: Additional information
  - `endpoints`: API endpoints
  - `authentication`: Auth requirements
  - `rate_limits`: Rate limiting info
  - `supported_formats`: Message formats

**Test**:
```bash
# Python (includes validation)
python test_a2a_client.py

# TypeScript (includes validation)
npx ts-node test_a2a_client.ts
```

---

## Authentication Testing

### Without Authentication (Default)

```bash
# Agent card (public)
curl http://localhost:8000/api/v1/a2a/agent-card

# Message (no auth required if A2A_API_KEY not set)
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello"}'
```

### With Authentication

1. **Set API Key in Environment**:
   ```bash
   export A2A_API_KEY="your-secret-key-here"
   ```

2. **Restart Backend Server**

3. **Test with API Key**:
   ```bash
   # Python
   python test_a2a_client.py --api-key "your-secret-key-here"

   # TypeScript
   npx ts-node test_a2a_client.ts --api-key "your-secret-key-here"

   # cURL
   curl -X POST http://localhost:8000/api/v1/a2a/message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-secret-key-here" \
     -d '{"content": "Hello"}'
   ```

4. **Test without API Key (should fail)**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/a2a/message \
     -H "Content-Type: application/json" \
     -d '{"content": "Hello"}'

   # Expected: 401 Unauthorized
   ```

---

## Message Format Tests

### Plain Text

```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! How are you?",
    "format": "plain"
  }'
```

### Markdown

```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "**Bold text** and *italic text*",
    "format": "markdown"
  }'
```

### Code

```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Show me a Python example",
    "format": "plain"
  }'
```

---

## Session Management Tests

### Create New Session

```bash
# First message (creates session)
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!"}'

# Response includes session_id in metadata
```

### Continue Existing Session

```bash
# Subsequent messages (use session_id from first response)
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Follow-up message",
    "session_id": "session_xyz789"
  }'
```

---

## Health Check

```bash
# A2A service health
curl http://localhost:8000/api/v1/a2a/health

# General health
curl http://localhost:8000/api/v1/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "protocol": "A2A",
  "version": "1.0.0",
  "agent_id": "ai-chat-agent-001",
  "active_sessions": 5
}
```

---

## Integration Examples

### JavaScript/TypeScript Client

```typescript
import { A2AClient } from './test_a2a_client'

const client = new A2AClient('http://localhost:8000')

// Get agent card
const card = await client.getAgentCard()
console.log('Agent:', card.name)

// Send message
const response = await client.sendMessage('Hello!', 'plain')
console.log('Response:', response.content)
```

### Python Client

```python
from test_a2a_client import A2AClient

client = A2AClient('http://localhost:8000')

# Get agent card
card = client.get_agent_card()
print(f"Agent: {card['name']}")

# Send message
response = client.send_message('Hello!', 'plain')
print(f"Response: {response['content']}")
```

### Web Browser (Fetch API)

```html
<script>
async function testA2A() {
  // Get agent card
  const cardRes = await fetch('http://localhost:8000/api/v1/a2a/agent-card')
  const card = await cardRes.json()
  console.log('Agent:', card.name)

  // Send message
  const msgRes = await fetch('http://localhost:8000/api/v1/a2a/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Hello!',
      format: 'plain'
    })
  })
  const response = await msgRes.json()
  console.log('Response:', response.content)
}

testA2A()
</script>
```

---

## Troubleshooting

### Connection Refused

**Error**: `Connection refused` or `ECONNREFUSED`

**Solution**: Ensure backend server is running on port 8000
```bash
cd backend
source venv/bin/activate
python -m src.server.app
```

### 401 Unauthorized

**Error**: `401 Unauthorized` when sending messages

**Solution**: Either:
1. Remove A2A_API_KEY from environment to disable auth
2. Include API key in request: `-H "Authorization: Bearer YOUR_KEY"`

### CORS Errors

**Error**: CORS policy blocks requests from browser

**Solution**: Backend already includes CORS middleware for localhost. If deploying, update CORS origins in `backend/src/server/app.py`

---

## Expected Test Results

Running full test suite should show:

```
============================================================
🚀 A2A Protocol Client Test Suite
============================================================
Base URL: http://localhost:8000
Authentication: Disabled
============================================================

🏥 Health Check...
   ✅ Service is healthy

📋 Test 1: Getting Agent Card...
   ✅ Success!
   Agent ID: ai-chat-agent-001
   Agent Name: AI Chat Agent

🔍 Test 3: Validating Agent Card Compliance...
   ✅ Agent card format is compliant!

💬 Test 2: Sending Message...
   ✅ Success!
   Message ID: msg_xxx
   Session ID: session_xxx

============================================================
✅ All tests passed successfully!
============================================================

📊 Summary:
   • Agent card retrieved and validated
   • Messages sent and received
   • Session maintained
   • A2A protocol compliance verified
```

---

## Next Steps

1. **Deploy to Production**: Use DEPLOYMENT.md guide
2. **Generate Agent Card**: `python generate_agent_card.py --base-url YOUR_URL`
3. **Share Agent Card**: Host at `/.well-known/agent-card.json`
4. **Integrate with Other Agents**: Use test clients as reference
