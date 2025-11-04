/**
 * WebSocket Service
 * Manages WebSocket connections for real-time chat
 */

import type {
  WSMessage,
  WSMessageType,
  ChatMessage,
  TypingIndicator,
} from '@shared/types/chat'

type MessageHandler = (message: WSMessage) => void
type ErrorHandler = (error: Error) => void
type ConnectionHandler = (connected: boolean) => void

const WS_BASE_URL = 'ws://localhost:8000'

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private sessionId: string | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private pingInterval: number | null = null

  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.sessionId = sessionId
      const url = `${WS_BASE_URL}/api/v1/sessions/ws/${sessionId}`

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.notifyConnectionHandlers(true)
          this.startPingInterval()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WSMessage
            this.notifyMessageHandlers(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          const error = new Error('WebSocket connection error')
          this.notifyErrorHandlers(error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.notifyConnectionHandlers(false)
          this.stopPingInterval()

          // Attempt to reconnect
          if (
            this.reconnectAttempts < this.maxReconnectAttempts &&
            this.sessionId
          ) {
            this.reconnectAttempts++
            console.log(
              `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
            )
            setTimeout(() => {
              if (this.sessionId) {
                this.connect(this.sessionId)
              }
            }, this.reconnectDelay * this.reconnectAttempts)
          }
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.stopPingInterval()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.sessionId = null
    this.reconnectAttempts = 0
    this.notifyConnectionHandlers(false)
  }

  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const message: WSMessage = {
      type: 'message',
      payload: { content },
      timestamp: new Date().toISOString(),
    }

    this.ws.send(JSON.stringify(message))
  }

  sendTyping(isTyping: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const message: WSMessage = {
      type: 'typing',
      payload: { is_typing: isTyping },
      timestamp: new Date().toISOString(),
    }

    this.ws.send(JSON.stringify(message))
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private notifyMessageHandlers(message: WSMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message)
      } catch (error) {
        console.error('Error in message handler:', error)
      }
    })
  }

  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error)
      } catch (err) {
        console.error('Error in error handler:', err)
      }
    })
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected)
      } catch (error) {
        console.error('Error in connection handler:', error)
      }
    })
  }

  private startPingInterval(): void {
    this.stopPingInterval()

    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const message: WSMessage = {
          type: 'ping',
          payload: {},
          timestamp: new Date().toISOString(),
        }
        this.ws.send(JSON.stringify(message))
      }
    }, 30000)
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService()
