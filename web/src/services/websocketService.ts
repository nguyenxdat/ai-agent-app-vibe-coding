/**
 * WebSocket Service
 * Manages WebSocket connections for real-time chat
 */

import type {
  WSMessage
} from '@shared/types/chat'

type MessageHandler = (message: WSMessage) => void
type ErrorHandler = (error: Error) => void
type ConnectionHandler = (connected: boolean) => void

const WS_BASE_URL = 'ws://localhost:8000'

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private baseReconnectDelay = 1000 // 1 second base delay
  private maxReconnectDelay = 30000 // 30 seconds max delay
  private reconnectTimeoutId: number | null = null
  private shouldReconnect = true
  private sessionId: string | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private pingInterval: number | null = null

  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔌 [WebSocketService] connect() called with sessionId: ${sessionId}`)

      // Check if already connected to the same session
      if (this.ws?.readyState === WebSocket.OPEN && this.sessionId === sessionId) {
        console.log('✅ [WebSocketService] Already connected to this session')
        resolve()
        return
      }

      // Disconnect from previous session if exists
      if (this.ws && this.sessionId !== sessionId) {
        console.log(`🔄 [WebSocketService] Disconnecting from previous session: ${this.sessionId}`)
        this.disconnect()
      }

      this.sessionId = sessionId
      const url = `${WS_BASE_URL}/api/v1/sessions/ws/${sessionId}`
      console.log(`🔌 [WebSocketService] Connecting to: ${url}`)

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('✅ [WebSocketService] WebSocket connected')
          this.reconnectAttempts = 0
          this.shouldReconnect = true
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

        this.ws.onclose = (event) => {
          console.log(`🔌 [WebSocketService] WebSocket closed (code: ${event.code}, reason: ${event.reason})`)
          this.notifyConnectionHandlers(false)
          this.stopPingInterval()

          // Attempt to reconnect with exponential backoff
          if (
            this.shouldReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts &&
            this.sessionId
          ) {
            this.reconnectAttempts++

            // Exponential backoff: delay = min(baseDelay * 2^(attempts-1), maxDelay)
            const exponentialDelay = Math.min(
              this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
              this.maxReconnectDelay
            )

            console.log(
              `🔄 [WebSocketService] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${exponentialDelay}ms...`
            )

            this.reconnectTimeoutId = window.setTimeout(() => {
              if (this.sessionId && this.shouldReconnect) {
                console.log(`🔄 [WebSocketService] Reconnecting to session: ${this.sessionId}`)
                this.connect(this.sessionId).catch((err) => {
                  console.error('❌ [WebSocketService] Reconnection failed:', err)
                })
              }
            }, exponentialDelay)
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ [WebSocketService] Max reconnection attempts reached')
            const error = new Error('Failed to reconnect after maximum attempts')
            this.notifyErrorHandlers(error)
          }
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    console.log(`🔌 [WebSocketService] disconnect() called`)
    this.shouldReconnect = false
    this.stopPingInterval()
    this.cancelReconnect()

    if (this.ws) {
      // Remove event handlers before closing to prevent reconnect
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.onopen = null
      this.ws.onmessage = null

      this.ws.close()
      this.ws = null
    }

    this.sessionId = null
    this.reconnectAttempts = 0
    this.notifyConnectionHandlers(false)
  }

  /**
   * Manually trigger reconnection (reset attempts counter)
   */
  reconnect(): Promise<void> {
    console.log(`🔄 [WebSocketService] Manual reconnect requested`)
    this.reconnectAttempts = 0
    this.shouldReconnect = true

    if (!this.sessionId) {
      return Promise.reject(new Error('No session ID available for reconnection'))
    }

    // Cancel any pending reconnect
    this.cancelReconnect()

    // Disconnect current connection if exists
    if (this.ws) {
      this.ws.onclose = null // Prevent auto-reconnect
      this.ws.close()
      this.ws = null
    }

    return this.connect(this.sessionId)
  }

  private cancelReconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }
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
