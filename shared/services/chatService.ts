/**
 * Chat Service
 * Manages chat sessions và messages
 */

import type { ChatSession } from '../types/session'
import type { Message } from '../types/message'
import type { StorageAdapter } from './storage/types'
import { STORAGE_KEYS } from './storage/types'
import { getStorageAdapter } from './storage/storageFactory'

export class ChatService {
  private storage: StorageAdapter | null = null

  async initialize(): Promise<void> {
    this.storage = await getStorageAdapter()
  }

  private async ensureStorage(): Promise<StorageAdapter> {
    if (!this.storage) {
      await this.initialize()
    }
    return this.storage!
  }

  /**
   * Get all chat sessions
   */
  async getAllSessions(): Promise<ChatSession[]> {
    const storage = await this.ensureStorage()
    const sessions = await storage.getItem<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS)
    return sessions || []
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<ChatSession | null> {
    const sessions = await this.getAllSessions()
    return sessions.find((session) => session.id === id) || null
  }

  /**
   * Get sessions by agent ID
   */
  async getSessionsByAgentId(agentId: string): Promise<ChatSession[]> {
    const sessions = await this.getAllSessions()
    return sessions.filter((session) => session.agentId === agentId)
  }

  /**
   * Create new chat session
   */
  async createSession(session: ChatSession): Promise<ChatSession> {
    const storage = await this.ensureStorage()
    const sessions = await this.getAllSessions()

    sessions.push(session)
    await storage.setItem(STORAGE_KEYS.CHAT_SESSIONS, sessions)

    return session
  }

  /**
   * Update chat session
   */
  async updateSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const storage = await this.ensureStorage()
    const sessions = await this.getAllSessions()

    const index = sessions.findIndex((s) => s.id === id)
    if (index === -1) {
      throw new Error(`Session với ID "${id}" không tồn tại`)
    }

    const updatedSession: ChatSession = {
      ...sessions[index]!,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    sessions[index] = updatedSession

    await storage.setItem(STORAGE_KEYS.CHAT_SESSIONS, sessions)
    return updatedSession
  }

  /**
   * Delete chat session
   */
  async deleteSession(id: string): Promise<void> {
    const storage = await this.ensureStorage()
    const sessions = await this.getAllSessions()

    const filtered = sessions.filter((s) => s.id !== id)

    if (filtered.length === sessions.length) {
      throw new Error(`Session với ID "${id}" không tồn tại`)
    }

    await storage.setItem(STORAGE_KEYS.CHAT_SESSIONS, filtered)
  }

  /**
   * Add message to session
   */
  async addMessage(sessionId: string, message: Message): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    const updatedMessages = [...session.messages, message]

    return await this.updateSession(sessionId, {
      messages: updatedMessages,
    })
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    sessionId: string,
    messageId: string,
    status: Message['status'],
    errorMessage?: string
  ): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    const updatedMessages = session.messages.map((msg) => {
      if (msg.id === messageId) {
        return {
          ...msg,
          status,
          metadata: errorMessage
            ? { ...msg.metadata, errorMessage }
            : msg.metadata,
        }
      }
      return msg
    })

    return await this.updateSession(sessionId, {
      messages: updatedMessages,
    })
  }

  /**
   * Get messages for session with pagination
   */
  async getMessages(
    sessionId: string,
    options?: {
      limit?: number
      before?: string // timestamp
    }
  ): Promise<Message[]> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    let messages = session.messages

    // Filter by timestamp if provided
    if (options?.before) {
      const beforeTime = new Date(options.before).getTime()
      messages = messages.filter((msg) => new Date(msg.timestamp).getTime() < beforeTime)
    }

    // Apply limit
    if (options?.limit) {
      messages = messages.slice(-options.limit)
    }

    return messages
  }

  /**
   * Clear old messages (keep last N messages)
   */
  async pruneMessages(sessionId: string, keepLast: number = 1000): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    if (session.messages.length <= keepLast) {
      return session
    }

    const prunedMessages = session.messages.slice(-keepLast)

    return await this.updateSession(sessionId, {
      messages: prunedMessages,
    })
  }
}

// Singleton instance
export const chatService = new ChatService()
