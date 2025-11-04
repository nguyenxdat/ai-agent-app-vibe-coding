/**
 * useChat Hook
 * Manages chat state and WebSocket communication
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { websocketService } from '../services/websocketService'
import { sessionApi } from '../services/sessionApi'
import type { ChatMessage, ChatSession, WSMessage } from '@shared/types/chat'

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

  // Load existing messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const existingMessages = await sessionApi.getMessages(sessionId)
      setMessages(existingMessages)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMsg)
      onError?.(err instanceof Error ? err : new Error(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, onError])

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await websocketService.connect(sessionId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect'
      setError(errorMsg)
      onError?.(err instanceof Error ? err : new Error(errorMsg))
    }
  }, [sessionId, onError])

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
    loadMessages()
    connect()

    return () => {
      websocketService.disconnect()
    }
  }, [loadMessages, connect])

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
    await connect()
  }, [connect])

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
