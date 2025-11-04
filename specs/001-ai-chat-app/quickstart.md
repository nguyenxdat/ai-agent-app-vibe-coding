# Quickstart Guide: Ứng Dụng AI Chat với A2A

**Version**: 1.0.0
**Date**: 2025-11-04

## Overview

Guide này giúp developers setup và run ứng dụng AI Chat trong môi trường development local. Bao gồm cả Frontend (Web + Desktop) và Backend (A2A Server + Agent).

## Prerequisites

### Required Software

- **Node.js**: 20.x LTS hoặc cao hơn
- **Python**: 3.11+ (cho backend)
- **Git**: Để clone repository
- **Code Editor**: VS Code (recommended) hoặc bất kỳ editor nào

### Optional Tools

- **Docker**: Để run backend trong container (alternative)
- **Postman** hoặc **Thunder Client**: Để test REST APIs

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ai-chat-app.git
cd ai-chat-app
```

### 2. Install Dependencies

#### Frontend Dependencies

```bash
# Install shared + web + desktop dependencies
npm install

# Hoặc nếu dùng pnpm (recommended cho monorepo)
pnpm install
```

#### Backend Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt
```

---

## Configuration

### 1. Environment Variables

Tạo file `.env` ở root directory:

```bash
# .env

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true

# A2A Agent Configuration
AGENT_NAME=AI Chat Assistant
AGENT_VERSION=1.0.0
A2A_PROTOCOL_VERSION=1.0.0

# Optional: LLM Provider (nếu agent cần)
OPENAI_API_KEY=your_openai_key_here
# hoặc
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 2. TypeScript Configuration

File `tsconfig.json` đã được setup với strict mode:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"],
      "@web/*": ["web/src/*"],
      "@desktop/*": ["desktop/src/*"]
    }
  }
}
```

---

## Running the Application

### Development Mode

#### Option 1: Run All Services Concurrently

```bash
# Ở root directory, run tất cả services
npm run dev

# This command runs:
# - Backend server (port 8000)
# - Web frontend (port 5173)
# - Desktop app (Electron)
```

#### Option 2: Run Services Separately

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
python src/server/app.py
```

Backend sẽ chạy trên `http://localhost:8000`

**Terminal 2 - Web Frontend**:
```bash
npm run dev:web
```

Web app sẽ chạy trên `http://localhost:5173`

**Terminal 3 - Desktop App**:
```bash
npm run dev:desktop
```

Electron app sẽ mở window mới

---

## Verify Installation

### 1. Check Backend Health

```bash
curl http://localhost:8000/api/v1/health

# Expected response:
# {"status": "ok", "version": "1.0.0"}
```

### 2. Check Agent Card

```bash
curl http://localhost:8000/api/v1/a2a/agent-card

# Expected response: Agent Card JSON
```

### 3. Test WebSocket Connection

Sử dụng wscat:

```bash
npm install -g wscat
wscat -c "ws://localhost:8000/ws/chat/test-session?token=dev_token"

# Should receive connection_ack message
```

---

## Basic Usage Examples

### Example 1: Create Agent Configuration

```bash
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "endpointUrl": "http://localhost:8000",
    "protocolVersion": "1.0.0"
  }'
```

### Example 2: Create Chat Session

```bash
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "<agent-id-from-step-1>"
  }'
```

### Example 3: Send Message via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat/<session-id>?token=dev_token')

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    messageId: crypto.randomUUID(),
    content: 'Xin chào!',
    format: 'plain',
    timestamp: new Date().toISOString()
  }))
}

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data))
}
```

---

## Development Workflow

### Hot Reload

- **Frontend**: Vite HMR tự động reload khi save files
- **Backend**: Sử dụng `uvicorn --reload` cho auto-reload

### Code Linting

```bash
# Lint frontend code
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type check
npm run type-check
```

### Running Tests

```bash
# Frontend tests
npm run test

# Backend tests
cd backend
pytest

# E2E tests
npm run test:e2e
```

---

## Project Structure Quick Reference

```
ai-chat-app/
├── shared/              # Shared React components, types, services
│   ├── components/
│   ├── services/
│   ├── types/
│   └── hooks/
│
├── web/                 # Web-specific code
│   ├── src/
│   │   ├── main.tsx    # Entry point
│   │   └── pages/
│   └── tests/
│
├── desktop/             # Electron-specific code
│   ├── src/
│   │   ├── main/       # Main process
│   │   └── renderer/   # Renderer (uses shared/)
│   └── resources/
│
├── backend/             # Python backend
│   ├── src/
│   │   ├── agents/     # AI agents
│   │   ├── server/     # FastAPI server
│   │   └── protocols/  # A2A protocol
│   └── tests/
│
└── specs/               # Documentation
    └── 001-ai-chat-app/
        ├── spec.md
        ├── plan.md
        └── this file
```

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Problem**: Backend không start vì port 8000 đã được sử dụng

**Solution**:
```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process hoặc change port trong .env
BACKEND_PORT=8001
```

### Issue 2: Module Not Found

**Problem**: Import errors cho shared modules

**Solution**:
```bash
# Rebuild TypeScript paths
npm run build:shared

# Hoặc check tsconfig paths
```

### Issue 3: WebSocket Connection Failed

**Problem**: Frontend không kết nối được WebSocket

**Solution**:
- Check backend đang chạy
- Verify VITE_WS_URL trong .env
- Check browser console cho CORS errors
- Ensure WebSocket port không bị firewall block

### Issue 4: Python Virtual Environment

**Problem**: Backend imports không work

**Solution**:
```bash
# Ensure venv is activated
which python  # Should show path in venv/

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

## Next Steps

### Development Tasks

1. **Implement Core Features**:
   - Follow `/speckit.tasks` để generate implementation tasks
   - Start với P1 user stories (basic chat functionality)

2. **Add Tests**:
   - Write unit tests cho services
   - Add component tests cho UI
   - Create E2E tests cho critical flows

3. **Enhance UI**:
   - Customize shadcn/ui components
   - Implement dark mode
   - Add animations và transitions

4. **Agent Development**:
   - Implement agent logic trong `backend/src/agents/`
   - Add capabilities và handlers
   - Test A2A protocol compliance

### Production Deployment

Khi ready cho production:

1. **Build Frontend**:
   ```bash
   npm run build:web      # Web production build
   npm run build:desktop  # Electron installers
   ```

2. **Deploy Backend**:
   ```bash
   # Using Docker
   docker build -t ai-chat-backend ./backend
   docker run -p 8000:8000 ai-chat-backend

   # Hoặc deploy đến cloud (AWS, GCP, Azure)
   ```

3. **Environment Configuration**:
   - Update API URLs cho production
   - Configure SSL certificates
   - Setup monitoring và logging

---

## Additional Resources

### Documentation

- [Feature Specification](./spec.md) - User requirements và success criteria
- [Implementation Plan](./plan.md) - Technical architecture
- [Data Model](./data-model.md) - Database schemas
- [API Contracts](./contracts/api.yaml) - OpenAPI specification
- [WebSocket Protocol](./contracts/websocket.md) - Realtime communication

### External Links

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Electron Docs](https://www.electronjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [ADK Framework](https://github.com/anthropics/adk) (hoặc LangChain docs)

---

## Support

Nếu gặp issues:

1. Check [Common Issues](#common-issues--solutions) section
2. Review error logs trong console/terminal
3. Search existing issues trong GitHub repository
4. Create new issue với detailed description và reproduction steps

---

## Summary

Quickstart guide này cung cấp:
- ✅ Complete setup instructions
- ✅ Environment configuration
- ✅ Development workflow
- ✅ Basic usage examples
- ✅ Troubleshooting guide
- ✅ Next steps cho development và deployment

Happy coding! 🚀
