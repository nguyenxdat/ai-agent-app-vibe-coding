/**
 * Message types cho chat application
 */

export type MessageSender = 'user' | 'agent'

export type MessageFormat = 'plain' | 'markdown' | 'code'

export type MessageStatus = 'sending' | 'sent' | 'error'

export interface MessageMetadata {
  language?: string // Programming language cho code format
  errorMessage?: string // Error message nếu status là error
  [key: string]: unknown // Allow additional metadata
}

export interface Message {
  id: string // UUID v4
  sessionId: string // Reference to ChatSession
  sender: MessageSender
  content: string // Max 10,000 characters
  format: MessageFormat
  timestamp: string // ISO 8601 datetime
  status: MessageStatus
  metadata?: MessageMetadata
}

// Type guards
export function isValidMessageSender(value: unknown): value is MessageSender {
  return value === 'user' || value === 'agent'
}

export function isValidMessageFormat(value: unknown): value is MessageFormat {
  return value === 'plain' || value === 'markdown' || value === 'code'
}

export function isValidMessageStatus(value: unknown): value is MessageStatus {
  return value === 'sending' || value === 'sent' || value === 'error'
}

export function isValidMessage(obj: unknown): obj is Message {
  if (!obj || typeof obj !== 'object') return false

  const msg = obj as Partial<Message>

  return (
    typeof msg.id === 'string' &&
    typeof msg.sessionId === 'string' &&
    isValidMessageSender(msg.sender) &&
    typeof msg.content === 'string' &&
    msg.content.length > 0 &&
    msg.content.length <= 10000 &&
    isValidMessageFormat(msg.format) &&
    typeof msg.timestamp === 'string' &&
    isValidMessageStatus(msg.status)
  )
}

// Helper functions
export function createMessage(
  sessionId: string,
  sender: MessageSender,
  content: string,
  format: MessageFormat = 'plain'
): Message {
  return {
    id: crypto.randomUUID(),
    sessionId,
    sender,
    content,
    format,
    timestamp: new Date().toISOString(),
    status: 'sending',
    metadata: {},
  }
}
