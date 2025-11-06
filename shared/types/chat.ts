/**
 * Chat and Message types
 */

export interface ChatMessage {
  id: string // UUID v4
  sessionId: string // Reference to chat session
  role: 'user' | 'agent' | 'system'
  content: string
  agentId?: string // Which agent sent the message (for agent role)
  timestamp: string // ISO 8601 datetime
  status: 'pending' | 'sent' | 'delivered' | 'error'
  error?: string
  format?: 'plain' | 'markdown' // Message format (default: plain)
}

export interface ChatSession {
  id: string // UUID v4
  userId: string // User identifier
  agentId: string // Active agent for this session
  title?: string // Optional session title
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime
  lastMessageAt?: string // ISO 8601 datetime
  isActive: boolean
}

export interface TypingIndicator {
  sessionId: string
  agentId: string
  isTyping: boolean
}

// WebSocket message types
export type WSMessageType =
  | 'message'
  | 'typing'
  | 'connection'
  | 'error'
  | 'ping'
  | 'pong'

export interface WSMessage {
  type: WSMessageType
  payload: unknown
  timestamp: string
}

export interface WSChatMessage extends WSMessage {
  type: 'message'
  payload: ChatMessage
}

export interface WSTypingMessage extends WSMessage {
  type: 'typing'
  payload: TypingIndicator
}

export interface WSErrorMessage extends WSMessage {
  type: 'error'
  payload: {
    code: string
    message: string
  }
}

export interface WSConnectionMessage extends WSMessage {
  type: 'connection'
  payload: {
    status: 'connected' | 'disconnected'
    sessionId: string
  }
}
