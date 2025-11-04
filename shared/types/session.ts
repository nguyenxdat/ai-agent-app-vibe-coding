/**
 * Chat Session types
 */

import type { Message } from './message'

export interface ChatSession {
  id: string // UUID v4
  agentId: string // Reference to AgentConfiguration
  title?: string // Max 100 characters, auto-generated or user-defined
  messages: Message[] // Can be empty array
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime, >= createdAt
  context?: Record<string, unknown> // Conversation context for agent
}

// Type guard
export function isValidChatSession(obj: unknown): obj is ChatSession {
  if (!obj || typeof obj !== 'object') return false

  const session = obj as Partial<ChatSession>

  return (
    typeof session.id === 'string' &&
    typeof session.agentId === 'string' &&
    Array.isArray(session.messages) &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string' &&
    new Date(session.updatedAt).getTime() >= new Date(session.createdAt).getTime()
  )
}

// Helper functions
export function createChatSession(agentId: string, title?: string): ChatSession {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    agentId,
    title: title || `Chat - ${new Date().toLocaleString()}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
    context: {},
  }
}

export function updateChatSession(
  session: ChatSession,
  updates: Partial<Pick<ChatSession, 'title' | 'messages' | 'context'>>
): ChatSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
}
