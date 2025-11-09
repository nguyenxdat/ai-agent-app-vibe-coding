/**
 * Error Recovery Utilities
 * Provides graceful degradation and error recovery strategies for A2A protocol
 */

import type { A2AErrorCode } from '../types/a2a'

/**
 * Error recovery strategies
 */
export type RecoveryStrategy = 'retry' | 'fallback' | 'notify' | 'ignore'

export interface RecoveryConfig {
  strategy: RecoveryStrategy
  retryable: boolean
  retryDelay?: number // milliseconds
  maxRetries?: number
  fallbackAction?: () => Promise<void>
  userMessage: string
}

/**
 * Get recovery configuration for A2A error codes
 */
export function getRecoveryConfig(errorCode: A2AErrorCode): RecoveryConfig {
  switch (errorCode) {
    case 'AGENT_TIMEOUT':
      return {
        strategy: 'retry',
        retryable: true,
        retryDelay: 2000,
        maxRetries: 3,
        userMessage:
          'The agent is taking longer than expected to respond. Retrying connection...',
      }

    case 'AGENT_UNAVAILABLE':
      return {
        strategy: 'fallback',
        retryable: true,
        retryDelay: 3000,
        maxRetries: 2,
        userMessage:
          'The agent is temporarily unavailable. Attempting to use alternative connection method...',
      }

    case 'RATE_LIMIT_EXCEEDED':
      return {
        strategy: 'retry',
        retryable: true,
        retryDelay: 5000,
        maxRetries: 3,
        userMessage: 'Rate limit exceeded. Please wait a moment before sending more messages.',
      }

    case 'SESSION_NOT_FOUND':
      return {
        strategy: 'retry',
        retryable: true,
        retryDelay: 1000,
        maxRetries: 1,
        userMessage: 'Session expired. Reconnecting...',
      }

    case 'AUTHENTICATION_FAILED':
      return {
        strategy: 'notify',
        retryable: false,
        userMessage:
          'Authentication failed. Please check your agent credentials in Settings and try again.',
      }

    case 'INVALID_MESSAGE':
      return {
        strategy: 'notify',
        retryable: false,
        userMessage:
          'Invalid message format. Please check your message and try again. If the problem persists, the message may exceed size limits.',
      }

    case 'INTERNAL_ERROR':
      return {
        strategy: 'fallback',
        retryable: true,
        retryDelay: 2000,
        maxRetries: 2,
        userMessage:
          'An internal error occurred. Attempting alternative connection method...',
      }

    default:
      return {
        strategy: 'notify',
        retryable: false,
        userMessage: 'An unexpected error occurred. Please try again or contact support.',
      }
  }
}

/**
 * Format user-friendly error messages
 */
export function formatErrorMessage(
  errorCode: A2AErrorCode,
  originalMessage?: string
): string {
  const config = getRecoveryConfig(errorCode)

  if (originalMessage) {
    return `${config.userMessage}\n\nDetails: ${originalMessage}`
  }

  return config.userMessage
}

/**
 * Check if error should trigger automatic recovery
 */
export function shouldAutoRecover(errorCode: A2AErrorCode): boolean {
  const config = getRecoveryConfig(errorCode)
  return config.retryable && (config.strategy === 'retry' || config.strategy === 'fallback')
}

/**
 * Circuit breaker for preventing repeated failed attempts
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime: number | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private readonly failureThreshold = 5
  private readonly resetTimeout = 30000 // 30 seconds

  /**
   * Check if circuit breaker allows the operation
   */
  canAttempt(): boolean {
    if (this.state === 'closed') {
      return true
    }

    if (this.state === 'open') {
      // Check if enough time has passed to try half-open
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeout) {
        console.log('🔄 Circuit breaker moving to half-open state')
        this.state = 'half-open'
        return true
      }
      return false
    }

    // Half-open state
    return true
  }

  /**
   * Record successful operation
   */
  recordSuccess(): void {
    if (this.state === 'half-open') {
      console.log('✅ Circuit breaker reset to closed state')
      this.state = 'closed'
      this.failureCount = 0
      this.lastFailureTime = null
    }
  }

  /**
   * Record failed operation
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === 'half-open') {
      console.log('❌ Circuit breaker reopened after failure in half-open state')
      this.state = 'open'
      return
    }

    if (this.failureCount >= this.failureThreshold && this.state === 'closed') {
      console.log(
        `⚠️ Circuit breaker opened after ${this.failureCount} failures. Blocking further attempts for ${this.resetTimeout}ms`
      )
      this.state = 'open'
    }
  }

  /**
   * Get current state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.lastFailureTime = null
  }
}

/**
 * Error context for tracking error patterns
 */
export class ErrorContext {
  private errorHistory: Array<{
    code: A2AErrorCode
    timestamp: number
    recovered: boolean
  }> = []
  private readonly maxHistorySize = 50

  /**
   * Record an error occurrence
   */
  recordError(errorCode: A2AErrorCode, recovered: boolean): void {
    this.errorHistory.push({
      code: errorCode,
      timestamp: Date.now(),
      recovered,
    })

    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
  }

  /**
   * Get recent error patterns
   */
  getRecentErrors(timeWindowMs = 60000): Array<{ code: A2AErrorCode; recovered: boolean }> {
    const cutoff = Date.now() - timeWindowMs
    return this.errorHistory.filter((e) => e.timestamp > cutoff)
  }

  /**
   * Check if error is recurring (same error multiple times recently)
   */
  isRecurringError(errorCode: A2AErrorCode, count = 3, timeWindowMs = 30000): boolean {
    const recent = this.getRecentErrors(timeWindowMs)
    const matchingErrors = recent.filter((e) => e.code === errorCode)
    return matchingErrors.length >= count
  }

  /**
   * Get recovery success rate
   */
  getRecoveryRate(timeWindowMs = 300000): number {
    const recent = this.getRecentErrors(timeWindowMs)
    if (recent.length === 0) return 1.0

    const recovered = recent.filter((e) => e.recovered).length
    return recovered / recent.length
  }

  /**
   * Clear error history
   */
  clear(): void {
    this.errorHistory = []
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * const circuitBreaker = new CircuitBreaker()
 * const errorContext = new ErrorContext()
 *
 * async function sendMessageWithRecovery(content: string) {
 *   // Check circuit breaker
 *   if (!circuitBreaker.canAttempt()) {
 *     throw new Error('Too many failures. Please wait before trying again.')
 *   }
 *
 *   try {
 *     await websocketService.sendMessage(content)
 *     circuitBreaker.recordSuccess()
 *   } catch (error) {
 *     const errorCode = parseErrorCode(error)
 *     const config = getRecoveryConfig(errorCode)
 *
 *     if (shouldAutoRecover(errorCode)) {
 *       // Try recovery
 *       try {
 *         await httpFallbackService.sendMessage(...)
 *         errorContext.recordError(errorCode, true)
 *         circuitBreaker.recordSuccess()
 *       } catch (recoveryError) {
 *         errorContext.recordError(errorCode, false)
 *         circuitBreaker.recordFailure()
 *         throw new Error(formatErrorMessage(errorCode))
 *       }
 *     } else {
 *       errorContext.recordError(errorCode, false)
 *       circuitBreaker.recordFailure()
 *       throw new Error(formatErrorMessage(errorCode))
 *     }
 *   }
 * }
 * ```
 */
