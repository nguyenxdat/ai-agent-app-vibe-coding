/**
 * useChat Hook
 * Manages chat state and WebSocket communication
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { websocketService } from '../services/websocketService'
import { sessionApi } from '../services/sessionApi'
import type { ChatMessage, WSMessage } from '@shared/types/chat'

// localStorage key prefix for chat messages
const CHAT_STORAGE_PREFIX = 'chat_messages_'
const STORAGE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CachedMessages {
  messages: ChatMessage[]
  timestamp: number
}

// Helper functions for localStorage persistence
function getCachedMessages(sessionId: string): ChatMessage[] | null {
  try {
    const key = CHAT_STORAGE_PREFIX + sessionId
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const data: CachedMessages = JSON.parse(cached)

    // Check if cache is expired
    if (Date.now() - data.timestamp > STORAGE_EXPIRY_MS) {
      localStorage.removeItem(key)
      return null
    }

    return data.messages
  } catch (error) {
    console.error('Failed to load cached messages:', error)
    return null
  }
}

function saveCachedMessages(sessionId: string, messages: ChatMessage[]): void {
  try {
    const key = CHAT_STORAGE_PREFIX + sessionId
    const data: CachedMessages = {
      messages,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to cache messages:', error)
  }
}

export function clearCachedMessages(sessionId: string): void {
  try {
    const key = CHAT_STORAGE_PREFIX + sessionId
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear cached messages:', error)
  }
}

interface UseChatOptions {
  sessionId: string
  onError?: (error: Error) => void
}

interface UseChatReturn {
  messages: ChatMessage[]
  isConnected: boolean
  isLoading: boolean
  isSending: boolean
  isTyping: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearError: () => void
  reconnect: () => Promise<void>
}

export function useChat({ sessionId, onError }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)

  // Handle incoming WebSocket messages
  useEffect(() => {
    const unsubscribeMessage = websocketService.onMessage((wsMessage: WSMessage) => {
      switch (wsMessage.type) {
        case 'message': {
          const chatMessage = wsMessage.payload as ChatMessage
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === chatMessage.id)) {
              return prev
            }
            return [...prev, chatMessage]
          })
          setIsSending(false)
          break
        }

        case 'typing': {
          const { is_typing } = wsMessage.payload as any
          setIsTyping(is_typing)

          // Auto-clear typing indicator after 5 seconds
          if (is_typing) {
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
            typingTimeoutRef.current = window.setTimeout(() => {
              setIsTyping(false)
            }, 5000)
          }
          break
        }

        case 'connection': {
          console.log('Connection status:', wsMessage.payload)
          break
        }

        case 'error': {
          const errorPayload = wsMessage.payload as any
          const errorMsg = errorPayload.message || 'WebSocket error'
          setError(errorMsg)
          onError?.(new Error(errorMsg))
          break
        }

        case 'pong': {
          // Pong received, connection is alive
          break
        }
      }
    })

    const unsubscribeConnection = websocketService.onConnection(setIsConnected)

    const unsubscribeError = websocketService.onError((err) => {
      setError(err.message)
      onError?.(err)
    })

    return () => {
      unsubscribeMessage()
      unsubscribeConnection()
      unsubscribeError()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [onError])

  // Initialize chat session
  useEffect(() => {
    console.log(`🔄 [useChat] useEffect triggered for sessionId: ${sessionId}`)

    if (!sessionId || sessionId === 'placeholder') {
      console.log('⏭️ [useChat] Skipping initialization (no valid session)')
      return
    }

    console.log('🚀 [useChat] Initializing chat session...')

    // Load cached messages first for instant display
    const cachedMessages = getCachedMessages(sessionId)
    if (cachedMessages && cachedMessages.length > 0) {
      console.log(`💾 [useChat] Loaded ${cachedMessages.length} cached messages`)
      setMessages(cachedMessages)
    }

    // Load messages from server
    const loadData = async () => {
      try {
        setIsLoading(true)
        const existingMessages = await sessionApi.getMessages(sessionId)
        setMessages(existingMessages)

        // Save to cache
        if (existingMessages.length > 0) {
          saveCachedMessages(sessionId, existingMessages)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load messages'
        setError(errorMsg)
        onError?.(err instanceof Error ? err : new Error(errorMsg))
      } finally {
        setIsLoading(false)
      }
    }

    // Connect WebSocket
    const connectWs = async () => {
      try {
        await websocketService.connect(sessionId)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to connect'
        setError(errorMsg)
        onError?.(err instanceof Error ? err : new Error(errorMsg))
      }
    }

    loadData()
    connectWs()

    return () => {
      console.log('🧹 [useChat] Cleanup: disconnecting WebSocket')
      websocketService.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Auto-save messages to localStorage when they change
  useEffect(() => {
    if (sessionId && sessionId !== 'placeholder' && messages.length > 0) {
      saveCachedMessages(sessionId, messages)
    }
  }, [sessionId, messages])

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return

      try {
        setIsSending(true)
        setError(null)

        // Send via WebSocket if connected, otherwise use REST API
        if (isConnected) {
          websocketService.sendMessage(content)
        } else {
          const message = await sessionApi.sendMessage(sessionId, content)
          setMessages((prev) => [...prev, message])
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message'
        setError(errorMsg)
        onError?.(err instanceof Error ? err : new Error(errorMsg))
        setIsSending(false)
      }
    },
    [sessionId, isConnected, isSending, onError]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reconnect = useCallback(async () => {
    setError(null)
    if (sessionId && sessionId !== 'placeholder') {
      try {
        await websocketService.reconnect()
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to reconnect'
        setError(errorMsg)
        onError?.(err instanceof Error ? err : new Error(errorMsg))
      }
    }
  }, [sessionId, onError])

  return {
    messages,
    isConnected,
    isLoading,
    isSending,
    isTyping,
    error,
    sendMessage,
    clearError,
    reconnect,
  }
}
