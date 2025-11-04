# AI Chat Application với A2A Protocol

Ứng dụng AI Chat đa nền tảng (Desktop và Web) với khả năng giao tiếp với các A2A (Agent-to-Agent) agents.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.x LTS hoặc cao hơn
- **Python**: 3.11+
- **pnpm**: `npm install -g pnpm` (recommended) hoặc npm

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd AiAgent

# 2. Install frontend dependencies
pnpm install
# hoặc: npm install

# 3. Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env với API keys và configuration của bạn
```

### Development

```bash
# Run tất cả services (frontend + backend)
npm run dev

# Hoặc run riêng lẻ:
# Terminal 1 - Backend
cd backend && python src/server/app.py

# Terminal 2 - Web
npm run dev:web

# Terminal 3 - Desktop
npm run dev:desktop
```

## 📁 Project Structure

```
AiAgent/
├── shared/              # Platform-agnostic React components, services, types
├── web/                 # Web-specific code (Vite + React)
├── desktop/             # Electron-specific code
├── backend/             # Python backend với A2A server
│   ├── src/
│   │   ├── agents/     # AI agent implementations
│   │   ├── server/     # FastAPI application
│   │   ├── protocols/  # A2A protocol handlers
│   │   └── utils/      # Utilities
│   └── tests/          # Backend tests
├── specs/              # Design documents và specifications
│   └── 001-ai-chat-app/
│       ├── spec.md     # Feature specification
│       ├── plan.md     # Implementation plan
│       ├── tasks.md    # Task breakdown
│       └── ...
└── package.json        # Root package với workspace config
```

## 🎯 Features

### Completed

#### Phase 1: Setup ✅
- ✅ Project structure initialized
- ✅ TypeScript với strict mode
- ✅ Vite build tool cho fast development
- ✅ Tailwind CSS cho styling
- ✅ ESLint + Prettier configured
- ✅ Pre-commit hooks với Husky
- ✅ FastAPI backend structure
- ✅ CORS middleware configured

#### Phase 2: Foundational ✅
- ✅ Shared types & models (Message, Agent, Session, A2A)
- ✅ Storage adapters (localStorage, Electron)
- ✅ Base services (AgentService, ChatService, ConfigService)
- ✅ Backend foundation (BaseAgent, A2A Protocol, WebSocket Manager)
- ✅ UI foundation (shadcn/ui components, Theme provider, Layouts)
- ✅ Error handling utilities

### Planned (Next Phases)

- 📋 Phase 3: User Story 1 - Agent Configuration Management
- 📋 Phase 4: User Story 2 - Basic Chat Interface
- 📋 Phase 5: User Story 3 - Session Management
- 📋 Phase 6: User Story 4 - A2A Communication
- 📋 Phase 7: User Story 5 - Advanced Features

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 với TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn/ui, assistant-ui
- **Desktop**: Electron 28+

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Agent Framework**: ADK hoặc LangChain
- **Protocol**: A2A (Agent-to-Agent) standard
- **Communication**: REST API + WebSocket

## 📚 Documentation

- [Feature Specification](specs/001-ai-chat-app/spec.md) - User requirements
- [Implementation Plan](specs/001-ai-chat-app/plan.md) - Technical architecture
- [Tasks](specs/001-ai-chat-app/tasks.md) - Implementation tasks
- [Data Model](specs/001-ai-chat-app/data-model.md) - Database schemas
- [API Contracts](specs/001-ai-chat-app/contracts/) - API documentation
- [Quickstart Guide](specs/001-ai-chat-app/quickstart.md) - Detailed setup

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd backend
pytest

# E2E tests
npm run test:e2e
```

## 🔧 Development Commands

```bash
# Linting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Type checking
npm run type-check

# Build
npm run build         # Build all (shared + web + desktop)
npm run build:web     # Build web only
npm run build:desktop # Build desktop only

# Clean
npm run clean         # Clean deps + build + cache
npm run clean:deps    # Remove node_modules + venv
npm run clean:build   # Remove build outputs
npm run clean:cache   # Remove cache files
npm run clean:logs    # Remove log files
npm run clean:all     # Clean everything
npm run reinstall     # Clean deps and reinstall

# Or use clean script
./clean.sh            # Interactive clean script
```

## 📝 Environment Variables

Copy `.env.example` to `.env` và configure:

```env
# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# LLM Provider (choose one)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

## 🚦 Project Status

**Current Phase**: Phase 2 Complete ✅

**Progress**: 32/140 tasks completed (23%)

**Next Steps**:
1. Begin Phase 3 (User Story 1 - Agent Configuration Management)
2. Continue with MVP features

## 🤝 Contributing

1. Check [tasks.md](specs/001-ai-chat-app/tasks.md) cho available tasks
2. Create branch từ task ID: `git checkout -b T014-message-type`
3. Implement task và test
4. Submit PR với clear description

## 📄 License

[Add your license here]

## 👥 Team

[Add team members here]

---

**Built with** ❤️ **using** React + TypeScript + FastAPI + A2A Protocol
