# AI Chat A2A Backend

Backend server for AI Chat Application with A2A (Agent-to-Agent) Protocol support.

## Features

- ✅ **A2A Protocol**: Full A2A protocol implementation with agent card discovery
- ✅ **Rich Message Formats**: Support for plain text, markdown, and code blocks
- ✅ **WebSocket Support**: Real-time bidirectional communication
- ✅ **Session Management**: Persistent conversation context
- ✅ **Authentication**: Optional Bearer token authentication
- ✅ **Health Checks**: Built-in health check endpoints
- ✅ **Docker Ready**: Production-ready Docker configuration
- ✅ **Auto Format Detection**: Intelligent message format detection

## Quick Start

### Prerequisites

- Python 3.11+
- pip

### Installation

1. **Create virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env as needed
   ```

4. **Generate agent card**:
   ```bash
   python generate_agent_card.py
   ```

5. **Run the server**:
   ```bash
   python -m src.server.app
   ```

6. **Verify**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

The server will start at `http://localhost:8000`

## API Endpoints

### A2A Protocol Endpoints

- `GET /api/v1/a2a/agent-card` - Get agent metadata and capabilities
- `POST /api/v1/a2a/message` - Send message to agent
- `GET /api/v1/a2a/health` - A2A service health check
- `GET /.well-known/agent-card.json` - Static agent card (for discovery)

### Other Endpoints

- `GET /api/v1/health` - General health check
- `GET /api/docs` - Interactive API documentation (Swagger UI)
- `GET /api/redoc` - Alternative API documentation (ReDoc)
- `WS /ws` - WebSocket endpoint

## Authentication

Authentication is **optional** and controlled by the `A2A_API_KEY` environment variable.

### Enable Authentication

```bash
# In .env file
A2A_API_KEY=your-secret-api-key-here
```

### Make Authenticated Requests

```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -d '{"content": "Hello!", "format": "plain"}'
```

## Configuration

All configuration is done via environment variables in `.env`:

```bash
# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# A2A Authentication (optional)
A2A_API_KEY=your-secret-key

# LLM API Keys (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Logging
LOG_LEVEL=INFO
```

## Message Formats

The agent supports three message formats:

### 1. Plain Text
```json
{
  "content": "Simple text message",
  "format": "plain"
}
```

### 2. Markdown
```json
{
  "content": "**Bold** and *italic* text",
  "format": "markdown"
}
```

### 3. Code
```json
{
  "content": "def hello():\n    print('Hello!')",
  "format": "code",
  "metadata": {
    "language": "python"
  }
}
```

## Session Management

Sessions maintain conversation context:

```bash
# First message (creates session)
curl -X POST .../message -d '{"content": "Hello"}'
# Returns: {"metadata": {"session_id": "abc-123"}}

# Continue conversation
curl -X POST .../message -d '{
  "content": "Continue",
  "session_id": "abc-123"
}'
```

## Development

### Project Structure

```
backend/
├── src/
│   ├── agents/          # Agent implementations
│   ├── protocols/       # A2A protocol handlers
│   ├── server/
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Authentication middleware
│   │   └── app.py       # FastAPI application
│   └── utils/           # Utility functions
├── generate_agent_card.py  # Agent card generator
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker image
└── .env.example        # Environment template
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# With coverage
pytest --cov=src
```

### Code Quality

```bash
# Format code
black src/

# Lint
pylint src/

# Type checking
mypy src/
```

## Docker Deployment

### Build Image

```bash
docker build -t ai-chat-backend:latest .
```

### Run Container

```bash
docker run -d \
  --name ai-chat-backend \
  -p 8000:8000 \
  -e A2A_API_KEY=your-secret-key \
  ai-chat-backend:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Production Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for comprehensive production deployment guide including:

- Systemd service configuration
- Nginx reverse proxy setup
- SSL/TLS configuration
- Monitoring and logging
- Scaling strategies

## Monitoring

### Health Checks

```bash
# General health
curl http://localhost:8000/api/v1/health

# A2A health
curl http://localhost:8000/api/v1/a2a/health
```

### Metrics

Access interactive API docs for detailed metrics:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Troubleshooting

### Server Won't Start

Check if port is already in use:
```bash
lsof -i :8000
```

### Authentication Issues

Verify API key is set:
```bash
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('A2A_API_KEY'))"
```

### CORS Errors

Update `CORS_ORIGINS` in `.env`:
```bash
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

## API Examples

### Python Client

```python
import httpx

async def send_message():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/a2a/message",
            json={
                "content": "Hello!",
                "format": "plain"
            },
            headers={
                "Authorization": "Bearer your-api-key"
            }
        )
        return response.json()
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:8000/api/v1/a2a/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    content: 'Hello!',
    format: 'plain'
  })
});

const data = await response.json();
console.log(data.content);
```

### cURL

```bash
curl -X POST http://localhost:8000/api/v1/a2a/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "content": "Show me a code example",
    "format": "plain"
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Your License Here]

## Support

- Documentation: See [A2A_API.md](A2A_API.md) for detailed API documentation
- Issues: GitHub Issues
- Email: support@your-domain.com
