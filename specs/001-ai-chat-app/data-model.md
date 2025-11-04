# Data Model: Ứng Dụng AI Chat với A2A

**Date**: 2025-11-04
**Feature**: AI Chat Application

## Overview

Document này định nghĩa data models, relationships, và validation rules cho ứng dụng AI Chat.

## Core Entities

### 1. Message

Đại diện cho một tin nhắn trong cuộc hội thoại giữa user và agent.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string (UUID) | Yes | Unique identifier | UUID v4 format |
| sessionId | string (UUID) | Yes | Reference to ChatSession | Must exist in ChatSession |
| sender | enum | Yes | "user" hoặc "agent" | Must be "user" or "agent" |
| content | string | Yes | Nội dung tin nhắn | Max 10,000 characters |
| format | enum | Yes | "plain", "markdown", "code" | Must be valid format |
| timestamp | ISO 8601 datetime | Yes | Thời điểm gửi | Valid datetime string |
| status | enum | Yes | "sending", "sent", "error" | Must be valid status |
| metadata | object | No | Additional data (language, code type, etc.) | Valid JSON object |

**Validation Rules**:
- content không được rỗng khi status là "sent"
- timestamp phải <= current time
- metadata.language required khi format là "code"

**State Transitions**:
```
sending → sent (successful delivery)
sending → error (failed delivery)
```

**Example**:
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  sessionId: "660e8400-e29b-41d4-a716-446655440001",
  sender: "user",
  content: "Thời tiết hôm nay thế nào?",
  format: "plain",
  timestamp: "2025-11-04T10:30:00Z",
  status: "sent",
  metadata: {}
}
```

---

### 2. AgentConfiguration

Đại diện cho cấu hình kết nối đến một A2A agent.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string (UUID) | Yes | Unique identifier | UUID v4 format |
| name | string | Yes | Display name | 3-50 characters |
| description | string | No | Agent description | Max 500 characters |
| endpointUrl | string (URL) | Yes | A2A agent endpoint | Valid HTTP/HTTPS URL |
| authToken | string | No | Authentication token | Encrypted when stored |
| capabilities | string[] | No | List of agent capabilities | Non-empty strings |
| isActive | boolean | Yes | Enabled/disabled status | Default: true |
| createdAt | ISO 8601 datetime | Yes | Creation timestamp | Valid datetime |
| lastUsedAt | ISO 8601 datetime | No | Last usage timestamp | Valid datetime |
| protocol Version | string | Yes | A2A protocol version | Semantic version (e.g., "1.0.0") |

**Validation Rules**:
- name phải unique trong user's configurations
- endpointUrl phải accessible (validation check trước khi save)
- authToken phải encrypted trước khi lưu vào storage
- capabilities mỗi item phải là non-empty string

**Example**:
```typescript
{
  id: "770e8400-e29b-41d4-a716-446655440002",
  name: "Weather Assistant",
  description: "Agent chuyên cung cấp thông tin thời tiết",
  endpointUrl: "https://api.example.com/agents/weather",
  authToken: "encrypted_token_here",
  capabilities: ["weather_forecast", "current_weather", "weather_alerts"],
  isActive: true,
  createdAt: "2025-11-04T09:00:00Z",
  lastUsedAt: "2025-11-04T10:30:00Z",
  protocolVersion: "1.0.0"
}
```

---

### 3. ChatSession

Đại diện cho một cuộc hội thoại với agent.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string (UUID) | Yes | Unique identifier | UUID v4 format |
| agentId | string (UUID) | Yes | Reference to AgentConfiguration | Must exist in AgentConfiguration |
| title | string | No | Session title (auto-generated or user-defined) | Max 100 characters |
| messages | Message[] | Yes | List of messages | Can be empty array |
| createdAt | ISO 8601 datetime | Yes | Creation timestamp | Valid datetime |
| updatedAt | ISO 8601 datetime | Yes | Last update timestamp | Valid datetime, >= createdAt |
| context | object | No | Conversation context for agent | Valid JSON object |

**Validation Rules**:
- updatedAt phải >= createdAt
- messages phải sorted by timestamp ascending
- title auto-generated from first user message nếu không provided

**Relationships**:
- One ChatSession has many Messages (1:N)
- One ChatSession belongs to one AgentConfiguration (N:1)

**Example**:
```typescript
{
  id: "660e8400-e29b-41d4-a716-446655440001",
  agentId: "770e8400-e29b-41d4-a716-446655440002",
  title: "Weather Inquiry - Nov 4",
  messages: [
    { /* Message object 1 */ },
    { /* Message object 2 */ }
  ],
  createdAt: "2025-11-04T10:25:00Z",
  updatedAt: "2025-11-04T10:32:00Z",
  context: {
    location: "Hanoi",
    previousQueries: ["weather", "temperature"]
  }
}
```

---

### 4. AgentCard

Đại diện cho metadata của một public A2A agent (dùng để chia sẻ).

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| name | string | Yes | Agent name | 3-50 characters |
| version | string | Yes | Agent version | Semantic version |
| description | string | Yes | Agent description | Max 1000 characters |
| capabilities | string[] | Yes | List of capabilities | At least 1 capability |
| endpointUrl | string (URL) | Yes | Public endpoint URL | Valid HTTPS URL |
| authRequirements | object | Yes | Authentication requirements | Valid auth config |
| protocolVersion | string | Yes | Supported A2A protocol version | Semantic version |
| provider | object | No | Provider information | Name, contact |

**Validation Rules**:
- version và protocolVersion phải follow semantic versioning (MAJOR.MINOR.PATCH)
- endpointUrl phải HTTPS (không accept HTTP cho security)
- capabilities phải có ít nhất 1 item
- authRequirements.type phải là "none", "bearer", "api_key", hoặc "oauth2"

**Example**:
```typescript
{
  name: "Weather Assistant Pro",
  version: "2.1.0",
  description: "Advanced weather agent with forecasts and alerts",
  capabilities: [
    "current_weather",
    "7_day_forecast",
    "weather_alerts",
    "historical_data"
  ],
  endpointUrl: "https://api.weatheragent.example.com/v1",
  authRequirements: {
    type: "bearer",
    requiredFields: ["token"]
  },
  protocolVersion: "1.0.0",
  provider: {
    name: "Weather Services Inc",
    email: "support@weatheragent.example.com",
    website: "https://weatheragent.example.com"
  }
}
```

---

## Relationships Diagram

```
AgentConfiguration (1) ──────┐
                             │
                             │ has many
                             ▼
                       ChatSession (N)
                             │
                             │ has many
                             ▼
                         Message (N)
```

**Cascade Rules**:
- Khi delete AgentConfiguration → cascade delete tất cả ChatSessions và Messages
- Khi delete ChatSession → cascade delete tất cả Messages
- Messages không thể exist without ChatSession

---

## Storage Strategy

### Web Platform (localStorage)

```typescript
// Storage keys
const STORAGE_KEYS = {
  AGENT_CONFIGS: 'ai-chat-agent-configs',
  CHAT_SESSIONS: 'ai-chat-sessions',
  MESSAGES: 'ai-chat-messages', // hoặc embed trong session
  APP_SETTINGS: 'ai-chat-settings'
}

// Encryption cho sensitive data
function encryptToken(token: string): string {
  // Use Web Crypto API
  // Implementation details in code
}
```

### Desktop Platform (electron-store)

```typescript
// Electron store schema
{
  agentConfigs: AgentConfiguration[],
  chatSessions: ChatSession[],
  messages: Message[], // hoặc embedded
  settings: AppSettings
}

// Native encryption enabled
const store = new Store({
  encryptionKey: 'user-specific-key',
  schema: { /* validation schema */ }
})
```

---

## Indexing Strategy

Để optimize performance với large datasets:

### Indexes Required

1. **Messages**:
   - Primary index: `id`
   - Secondary index: `sessionId` (for fast lookups by session)
   - Secondary index: `timestamp` (for chronological ordering)

2. **ChatSessions**:
   - Primary index: `id`
   - Secondary index: `agentId` (for grouping by agent)
   - Secondary index: `updatedAt` (for recent sessions list)

3. **AgentConfigurations**:
   - Primary index: `id`
   - Unique index: `name` (ensure unique names)
   - Secondary index: `lastUsedAt` (for sorting by recent usage)

---

## Data Migrations

Khi schema changes, cần migration strategy:

```typescript
interface Migration {
  version: number
  up: (data: any) => any
  down: (data: any) => any
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (data) => {
      // Add new field `protocolVersion` to AgentConfiguration
      return data.map(config => ({
        ...config,
        protocolVersion: config.protocolVersion || "1.0.0"
      }))
    },
    down: (data) => {
      // Remove protocolVersion field
      return data.map(({ protocolVersion, ...config }) => config)
    }
  }
]
```

---

## Validation Utilities

```typescript
// Type guards và validation helpers
function isValidMessage(obj: any): obj is Message {
  return (
    typeof obj.id === 'string' &&
    typeof obj.sessionId === 'string' &&
    ['user', 'agent'].includes(obj.sender) &&
    typeof obj.content === 'string' &&
    obj.content.length > 0 &&
    obj.content.length <= 10000 &&
    ['plain', 'markdown', 'code'].includes(obj.format) &&
    typeof obj.timestamp === 'string' &&
    ['sending', 'sent', 'error'].includes(obj.status)
  )
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}
```

---

## Summary

Data model này cung cấp:
- ✅ Clear entity definitions với validation rules
- ✅ Relationships giữa entities
- ✅ Storage strategy cho cả Web và Desktop
- ✅ Indexing strategy cho performance
- ✅ Migration support cho schema evolution
- ✅ Validation utilities cho runtime checks

All entities are designed to be:
- **Serializable**: Có thể convert to/from JSON
- **Validatable**: Clear validation rules
- **Migratable**: Support schema versions
- **Platform-agnostic**: Work trên cả Web và Desktop
