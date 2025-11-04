/**
 * A2A (Agent-to-Agent) Protocol types
 */

// WebSocket message types
export type WebSocketMessageType =
  | 'connection_ack'
  | 'ping'
  | 'pong'
  | 'message'
  | 'typing'
  | 'stream'
  | 'error'
  | 'disconnect'

export interface BaseWebSocketMessage {
  type: WebSocketMessageType
  timestamp: string // ISO 8601
}

// Connection acknowledgment
export interface ConnectionAckMessage extends BaseWebSocketMessage {
  type: 'connection_ack'
  sessionId: string
  serverVersion: string
}

// Heartbeat messages
export interface PingMessage extends BaseWebSocketMessage {
  type: 'ping'
}

export interface PongMessage extends BaseWebSocketMessage {
  type: 'pong'
}

// User message
export interface UserMessage extends BaseWebSocketMessage {
  type: 'message'
  messageId: string
  content: string
  format: 'plain' | 'markdown' | 'code'
  metadata?: Record<string, unknown>
}

// Agent response
export interface AgentMessage extends BaseWebSocketMessage {
  type: 'message'
  messageId: string
  replyTo: string
  sender: 'agent'
  content: string
  format: 'plain' | 'markdown' | 'code'
  metadata?: Record<string, unknown>
}

// Typing indicator
export interface TypingMessage extends BaseWebSocketMessage {
  type: 'typing'
  isTyping: boolean
}

// Streaming response
export interface StreamMessage extends BaseWebSocketMessage {
  type: 'stream'
  messageId: string
  replyTo: string
  chunk: string
  isComplete: boolean
  format?: 'plain' | 'markdown' | 'code'
  metadata?: Record<string, unknown>
}

// Error codes
export type A2AErrorCode =
  | 'AGENT_UNAVAILABLE'
  | 'AGENT_TIMEOUT'
  | 'INVALID_MESSAGE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SESSION_NOT_FOUND'
  | 'AUTHENTICATION_FAILED'
  | 'INTERNAL_ERROR'

export interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error'
  code: A2AErrorCode
  message: string
  relatedMessageId?: string
  retryable: boolean
}

// Disconnect
export interface DisconnectMessage extends BaseWebSocketMessage {
  type: 'disconnect'
  reason: string
  code: number // WebSocket close code
}

export type WebSocketMessage =
  | ConnectionAckMessage
  | PingMessage
  | PongMessage
  | UserMessage
  | AgentMessage
  | TypingMessage
  | StreamMessage
  | ErrorMessage
  | DisconnectMessage

// A2A HTTP API types
export interface A2AMessageRequest {
  messageId: string
  sender: {
    agentId: string
    agentName: string
  }
  content: string
  timestamp: string
  context?: Record<string, unknown>
}

export interface A2AMessageResponse {
  messageId: string
  content: string
  format: 'plain' | 'markdown' | 'code'
  timestamp: string
  metadata?: Record<string, unknown>
}

// Type guards
export function isWebSocketMessage(obj: unknown): obj is WebSocketMessage {
  if (!obj || typeof obj !== 'object') return false

  const msg = obj as Partial<WebSocketMessage>

  return typeof msg.type === 'string' && typeof msg.timestamp === 'string'
}

export function isErrorMessage(msg: WebSocketMessage): msg is ErrorMessage {
  return msg.type === 'error'
}

export function isAgentMessage(msg: WebSocketMessage): msg is AgentMessage {
  return msg.type === 'message' && 'sender' in msg && msg.sender === 'agent'
}

export function isTypingMessage(msg: WebSocketMessage): msg is TypingMessage {
  return msg.type === 'typing'
}
