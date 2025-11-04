# Implementation Plan: Ứng Dụng AI Chat với A2A

**Branch**: `001-ai-chat-app` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-chat-app/spec.md`

## Summary

Xây dựng ứng dụng AI Chat đa nền tảng (Desktop và Web) với khả năng giao tiếp với các A2A agents. Frontend sử dụng React + TypeScript + Tailwind CSS + shadcn/ui + assistant-ui để tạo giao diện chat hiện đại. Backend sử dụng Python với ADK framework hoặc LangChain để xây dựng AI agent và A2A server public. Ứng dụng cho phép users chat với agents, cấu hình kết nối A2A, và hỗ trợ rich message formats.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x (strict mode)
- Backend: Python 3.11+ hoặc TypeScript/Node.js 20+ (tùy theo ADK framework support)

**Primary Dependencies**:
- Frontend: React 18+, Vite 5+, Tailwind CSS 3+, shadcn/ui, assistant-ui, Electron 28+ (LTS)
- Backend: ADK framework hoặc LangChain, FastAPI/Express (cho A2A server), WebSocket library

**Storage**:
- Local: localStorage (Web), electron-store (Desktop) cho chat history và agent configurations
- Optional: SQLite hoặc PostgreSQL cho persistent storage nếu cần sync giữa devices

**Testing**:
- Frontend: Vitest, React Testing Library
- Backend: pytest (Python) hoặc Jest (Node.js)
- Integration: Playwright cho E2E testing

**Target Platform**:
- Desktop: Windows 10+, macOS 11+, Linux (Electron app)
- Web: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Project Type**: Web + Desktop (hybrid cross-platform application)

**Performance Goals**:
- UI render time < 100ms
- Message send/receive latency < 500ms (excluding agent processing time)
- Support 100+ messages in chat history without performance degradation
- App startup time < 3 seconds

**Constraints**:
- Message response time < 5 seconds (từ agent, không bao gồm network latency)
- Offline-capable: Chat history và configurations phải accessible khi offline
- Platform-agnostic core: Shared codebase tối thiểu 80% giữa Desktop và Web
- A2A protocol compliance: Tất cả agent communications phải tuân theo A2A standard

**Scale/Scope**:
- Support 5-10 concurrent agent configurations
- Chat history lên đến 1000 messages per session
- 3-5 main screens (Chat, Settings, Agent Config, History)
- 2 platforms (Desktop + Web) với shared components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Kiến Trúc Đa Nền Tảng

- **Yêu cầu**: Component UI và business logic độc lập với nền tảng
- **Compliance**: ✅ Sẽ sử dụng shared React components, platform-specific code isolated trong /desktop và /web modules
- **Evidence**: Project structure có shared/ directory chứa core components, services, và types

### ✅ II. Tiêu Chuẩn UI/UX Hiện Đại

- **Yêu cầu**: Tailwind CSS, shadcn/ui, assistant-ui, responsive, dark/light mode
- **Compliance**: ✅ Tech stack includes tất cả required libraries
- **Evidence**: Dependencies list và UI component structure

### ✅ III. Backend Ưu Tiên Agent (BẮT BUỘC)

- **Yêu cầu**: ADK framework hoặc LangChain, A2A protocol, modular agents
- **Compliance**: ✅ Backend architecture với ADK/LangChain làm core, separate agent logic và transport
- **Evidence**: Backend structure có /agents, /server, /protocols directories

### ✅ IV. Quản Lý Cấu Hình A2A

- **Yêu cầu**: UI cho CRUD agent configs, validation, import/export
- **Compliance**: ✅ Settings screen với agent configuration management
- **Evidence**: Frontend services/agentConfig và UI components/settings

### ✅ V. Type Safety và Chất Lượng Code

- **Yêu cầu**: TypeScript strict mode, type definitions, ESLint, Prettier, pre-commit hooks
- **Compliance**: ✅ TypeScript strict mode enabled, tooling configured
- **Evidence**: tsconfig.json với strict: true, .eslintrc, .prettierrc

**Constitution Check Status**: ✅ **PASSED** - Tất cả nguyên tắc được tuân thủ

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api.yaml        # OpenAPI spec cho A2A server
│   └── websocket.md    # WebSocket protocol documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Hybrid Web + Desktop Application Structure

# Shared code (platform-agnostic)
shared/
├── components/          # React components dùng chung
│   ├── chat/           # Chat UI components
│   ├── settings/       # Settings/config components
│   └── common/         # Reusable UI primitives
├── services/           # Business logic
│   ├── agentService.ts # Agent communication
│   ├── chatService.ts  # Chat management
│   └── configService.ts # Configuration management
├── types/              # TypeScript type definitions
│   ├── agent.ts
│   ├── message.ts
│   └── a2a.ts
├── hooks/              # Custom React hooks
└── utils/              # Utility functions

# Web-specific code
web/
├── src/
│   ├── main.tsx        # Web entry point
│   ├── App.tsx         # Root component
│   └── pages/          # Page components
├── public/
└── tests/

# Desktop-specific code (Electron)
desktop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts
│   │   └── ipc/        # IPC handlers
│   ├── preload/        # Preload scripts
│   └── renderer/       # Renderer process (uses shared/)
├── resources/          # App icons, etc.
└── tests/

# Backend (A2A Server + Agent)
backend/
├── src/
│   ├── agents/         # AI agent implementations
│   │   ├── base.py     # Base agent class
│   │   └── chat_agent.py # Main chat agent
│   ├── server/         # A2A server
│   │   ├── app.py      # FastAPI app
│   │   ├── routes/     # API routes
│   │   └── websocket/  # WebSocket handlers
│   ├── protocols/      # A2A protocol implementation
│   │   ├── a2a.py      # Protocol handlers
│   │   └── schemas.py  # Pydantic models
│   └── utils/          # Utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/       # A2A contract tests
├── agent_card.json     # Agent Card metadata
└── requirements.txt    # Python dependencies

# Configuration files (root)
├── package.json        # Frontend dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite build config
├── tailwind.config.js  # Tailwind CSS config
├── .eslintrc.json      # ESLint config
└── .prettierrc         # Prettier config
```

**Structure Decision**: Hybrid structure với shared/ directory chứa platform-agnostic code (React components, services, types) và separate directories cho web/ và desktop/ platforms. Backend là independent Python project. Approach này maximize code reuse trong khi maintain platform-specific optimizations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Không có violations - tất cả nguyên tắc trong Constitution được tuân thủ.
