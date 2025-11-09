/**
 * useMessagePagination Hook
 * Manages pagination and lazy loading for chat messages
 */

import { useState, useCallback, useEffect } from 'react'
import type { Message } from '../types/message'
import { chatService } from '../services/chatService'

interface UseMessagePaginationOptions {
  sessionId: string
  pageSize?: number
  initialLoadCount?: number
}

interface UseMessagePaginationReturn {
  messages: Message[]
  hasMore: boolean
  isLoading: boolean
  loadMore: () => Promise<void>
  loadInitial: () => Promise<void>
  reset: () => void
}

export function useMessagePagination({
  sessionId,
  pageSize = 50,
  initialLoadCount = 50,
}: UseMessagePaginationOptions): UseMessagePaginationReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)

  /**
   * Load initial messages (most recent)
   */
  const loadInitial = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get session to check total message count
      const session = await chatService.getSessionById(sessionId)

      if (!session) {
        setMessages([])
        setHasMore(false)
        setTotalMessages(0)
        return
      }

      const total = session.messages.length
      setTotalMessages(total)

      // Load most recent messages
      const recentMessages = await chatService.getRecentMessages(sessionId, initialLoadCount)
      setMessages(recentMessages)
      setLoadedCount(recentMessages.length)
      setHasMore(recentMessages.length < total)
    } catch (error) {
      console.error('Failed to load initial messages:', error)
      setMessages([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, initialLoadCount])

  /**
   * Load more older messages
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return

    setIsLoading(true)
    try {
      // Get the timestamp of the oldest currently loaded message
      const oldestMessage = messages[0]
      if (!oldestMessage) return

      // Load messages before this timestamp
      const olderMessages = await chatService.getMessages(sessionId, {
        before: oldestMessage.timestamp,
        limit: pageSize,
      })

      if (olderMessages.length > 0) {
        // Prepend older messages
        setMessages((prev) => [...olderMessages, ...prev])
        setLoadedCount((prev) => prev + olderMessages.length)
        setHasMore(loadedCount + olderMessages.length < totalMessages)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, messages, hasMore, isLoading, pageSize, loadedCount, totalMessages])

  /**
   * Reset pagination state
   */
  const reset = useCallback(() => {
    setMessages([])
    setHasMore(false)
    setLoadedCount(0)
    setTotalMessages(0)
  }, [])

  /**
   * Load initial messages when session changes
   */
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  return {
    messages,
    hasMore,
    isLoading,
    loadMore,
    loadInitial,
    reset,
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * function ChatView({ sessionId }: { sessionId: string }) {
 *   const { messages, hasMore, isLoading, loadMore } = useMessagePagination({
 *     sessionId,
 *     pageSize: 50,
 *     initialLoadCount: 50,
 *   })
 *
 *   return (
 *     <MessageList
 *       messages={messages}
 *       isLoading={isLoading}
 *       hasMoreMessages={hasMore}
 *       onLoadMore={loadMore}
 *     />
 *   )
 * }
 * ```
 */
