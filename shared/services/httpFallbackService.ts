/**
 * HTTP Fallback Service
 * Provides HTTP-based communication when WebSocket/A2A protocol fails
 */

import type { AgentConfiguration } from '../types/agent'

export interface HttpFallbackMessage {
  content: string
  sessionId: string
  agentId: string
}

export interface HttpFallbackResponse {
  content: string
  format: 'plain' | 'markdown' | 'code'
  timestamp: string
  messageId: string
}

class HttpFallbackService {
  /**
   * Send message via HTTP POST (fallback when WebSocket unavailable)
   */
  async sendMessage(
    message: HttpFallbackMessage,
    agentConfig: AgentConfiguration
  ): Promise<HttpFallbackResponse> {
    const url = `${agentConfig.endpointUrl}/api/v1/chat`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(agentConfig.authToken && {
            Authorization: `Bearer ${agentConfig.authToken}`,
          }),
        },
        body: JSON.stringify({
          message: message.content,
          session_id: message.sessionId,
          agent_id: message.agentId,
        }),
        signal: AbortSignal.timeout(60000), // 60 second timeout for processing
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        content: data.content || data.message || '',
        format: data.format || 'plain',
        timestamp: data.timestamp || new Date().toISOString(),
        messageId: data.message_id || data.id || `http_${Date.now()}`,
      }
    } catch (error) {
      console.error('HTTP fallback failed:', error)

      // Provide user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error(
            'Request timed out. The agent may be processing a complex request. Please try again.'
          )
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.')
        } else if (error.message.includes('401')) {
          throw new Error('Authentication failed. Please check your agent credentials.')
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        } else if (error.message.includes('503')) {
          throw new Error('Agent service temporarily unavailable. Please try again later.')
        }
      }

      throw error
    }
  }

  /**
   * Check if HTTP fallback is available for an agent
   */
  async checkAvailability(endpointUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${endpointUrl}/api/v1/chat`, {
        method: 'OPTIONS',
        signal: AbortSignal.timeout(5000),
      })

      return response.ok || response.status === 405 // 405 means endpoint exists but OPTIONS not supported
    } catch {
      return false
    }
  }

  /**
   * Send message with automatic retry
   */
  async sendMessageWithRetry(
    message: HttpFallbackMessage,
    agentConfig: AgentConfiguration,
    maxRetries = 2
  ): Promise<HttpFallbackResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendMessage(message, agentConfig)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on non-retryable errors
        if (
          lastError.message.includes('401') ||
          lastError.message.includes('403') ||
          lastError.message.includes('400')
        ) {
          throw lastError
        }

        // Retry on network errors, timeouts, server errors
        if (attempt < maxRetries) {
          console.log(`HTTP fallback attempt ${attempt + 1} failed, retrying...`)
          await this.delay(1000 * (attempt + 1)) // Exponential backoff
        }
      }
    }

    throw lastError || new Error('HTTP fallback failed after all retries')
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const httpFallbackService = new HttpFallbackService()

/**
 * Example usage:
 *
 * ```typescript
 * // In your chat component when WebSocket fails
 * try {
 *   await websocketService.sendMessage(content)
 * } catch (wsError) {
 *   console.log('WebSocket failed, trying HTTP fallback...')
 *   try {
 *     const response = await httpFallbackService.sendMessageWithRetry(
 *       { content, sessionId, agentId },
 *       agentConfig
 *     )
 *     // Display response.content in chat
 *   } catch (httpError) {
 *     // Show error to user
 *     console.error('Both WebSocket and HTTP failed:', httpError)
 *   }
 * }
 * ```
 */
