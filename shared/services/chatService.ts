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
   * Add message to session with automatic timestamp-based ordering
   */
  async addMessage(sessionId: string, message: Message): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    // Add message and sort by timestamp
    const updatedMessages = this.sortMessagesByTimestamp([...session.messages, message])

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
   * Get messages for session with pagination and timestamp ordering
   */
  async getMessages(
    sessionId: string,
    options?: {
      limit?: number
      before?: string // timestamp
      after?: string // timestamp
    }
  ): Promise<Message[]> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    // Always ensure messages are sorted by timestamp
    let messages = this.sortMessagesByTimestamp(session.messages)

    // Filter by timestamp range if provided
    if (options?.before) {
      const beforeTime = new Date(options.before).getTime()
      messages = messages.filter((msg) => new Date(msg.timestamp).getTime() < beforeTime)
    }

    if (options?.after) {
      const afterTime = new Date(options.after).getTime()
      messages = messages.filter((msg) => new Date(msg.timestamp).getTime() > afterTime)
    }

    // Apply limit (take most recent if limit specified)
    if (options?.limit) {
      messages = messages.slice(-options.limit)
    }

    return messages
  }

  /**
   * Sort messages by timestamp (ascending order)
   */
  private sortMessagesByTimestamp(messages: Message[]): Message[] {
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()

      // Primary sort: timestamp
      if (timeA !== timeB) {
        return timeA - timeB
      }

      // Secondary sort: use message ID for stable sort when timestamps are identical
      // This handles the edge case of messages arriving at the exact same millisecond
      return a.id.localeCompare(b.id)
    })
  }

  /**
   * Validate and fix message ordering in a session
   * Useful for fixing corrupted or out-of-order message history
   */
  async validateAndFixMessageOrder(sessionId: string): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    // Check if messages are already correctly ordered
    const isOrdered = this.areMessagesOrdered(session.messages)

    if (isOrdered) {
      console.log(`✅ Messages in session ${sessionId} are already correctly ordered`)
      return session
    }

    console.log(`🔧 Fixing message order in session ${sessionId}`)
    const sortedMessages = this.sortMessagesByTimestamp(session.messages)

    return await this.updateSession(sessionId, {
      messages: sortedMessages,
    })
  }

  /**
   * Check if messages are in correct timestamp order
   */
  private areMessagesOrdered(messages: Message[]): boolean {
    for (let i = 1; i < messages.length; i++) {
      const prevTime = new Date(messages[i - 1]!.timestamp).getTime()
      const currTime = new Date(messages[i]!.timestamp).getTime()

      if (prevTime > currTime) {
        return false
      }
    }
    return true
  }

  /**
   * Get most recent messages (optimized for performance)
   */
  async getRecentMessages(sessionId: string, count: number = 50): Promise<Message[]> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    // Sort and take the most recent messages
    const sortedMessages = this.sortMessagesByTimestamp(session.messages)
    return sortedMessages.slice(-count)
  }

  /**
   * Get messages in time range
   */
  async getMessagesInRange(
    sessionId: string,
    startTime: string,
    endTime: string
  ): Promise<Message[]> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    const startMillis = new Date(startTime).getTime()
    const endMillis = new Date(endTime).getTime()

    const sortedMessages = this.sortMessagesByTimestamp(session.messages)

    return sortedMessages.filter((msg) => {
      const msgTime = new Date(msg.timestamp).getTime()
      return msgTime >= startMillis && msgTime <= endMillis
    })
  }

  /**
   * Clear old messages (keep last N messages) with timestamp ordering
   */
  async pruneMessages(sessionId: string, keepLast: number = 1000): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId)

    if (!session) {
      throw new Error(`Session với ID "${sessionId}" không tồn tại`)
    }

    if (session.messages.length <= keepLast) {
      return session
    }

    // Sort messages by timestamp before pruning to ensure we keep the most recent
    const sortedMessages = this.sortMessagesByTimestamp(session.messages)
    const prunedMessages = sortedMessages.slice(-keepLast)

    return await this.updateSession(sessionId, {
      messages: prunedMessages,
    })
  }
}

// Singleton instance
export const chatService = new ChatService()
