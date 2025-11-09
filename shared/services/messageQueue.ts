/**
 * Message Queue Service
 * Queues messages when offline and sends when back online
 */

import { offlineDetector } from '../utils/offlineDetector'

export interface QueuedMessage {
  id: string
  content: string
  timestamp: string
  sessionId: string
  retryCount: number
}

class MessageQueueService {
  private queue: QueuedMessage[] = []
  private readonly MAX_QUEUE_SIZE = 100
  private readonly MAX_RETRY_COUNT = 3
  private isProcessing = false

  constructor() {
    // Subscribe to online status
    if (typeof window !== 'undefined') {
      offlineDetector.subscribe((isOffline) => {
        if (!isOffline) {
          // When back online, process queue
          this.processQueue()
        }
      })
    }
  }

  /**
   * Add message to queue
   */
  enqueue(content: string, sessionId: string): QueuedMessage {
    // Check queue size limit
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest message
      this.queue.shift()
    }

    const message: QueuedMessage = {
      id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date().toISOString(),
      sessionId,
      retryCount: 0,
    }

    this.queue.push(message)
    console.log(`📬 Message queued (${this.queue.length} in queue)`, message.id)

    return message
  }

  /**
   * Process queued messages
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    if (offlineDetector.isCurrentlyOffline()) {
      console.log('📡 Still offline, cannot process queue')
      return
    }

    this.isProcessing = true
    console.log(`📤 Processing message queue (${this.queue.length} messages)`)

    const messagesToProcess = [...this.queue]
    this.queue = []

    for (const message of messagesToProcess) {
      try {
        await this.sendMessage(message)
        console.log(`✅ Queued message sent: ${message.id}`)
      } catch (error) {
        console.error(`❌ Failed to send queued message: ${message.id}`, error)

        // Retry logic
        if (message.retryCount < this.MAX_RETRY_COUNT) {
          message.retryCount++
          this.queue.push(message)
          console.log(`🔄 Re-queued message (retry ${message.retryCount}/${this.MAX_RETRY_COUNT})`)
        } else {
          console.error(`❌ Message failed after ${this.MAX_RETRY_COUNT} retries, discarding`)
        }
      }
    }

    this.isProcessing = false

    // If there are still messages (retries), process again after delay
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 5000) // 5 second delay
    }
  }

  /**
   * Send a queued message
   * This should be implemented by the calling code
   */
  private async sendMessage(message: QueuedMessage): Promise<void> {
    // This is a placeholder - actual implementation should use WebSocketService
    // or HTTP API to send the message
    throw new Error('sendMessage not implemented - override this method')
  }

  /**
   * Set custom send function
   */
  setSendFunction(sendFn: (message: QueuedMessage) => Promise<void>): void {
    this.sendMessage = sendFn
  }

  /**
   * Get current queue
   */
  getQueue(): QueuedMessage[] {
    return [...this.queue]
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = []
    console.log('🗑️ Message queue cleared')
  }

  /**
   * Remove specific message from queue
   */
  removeMessage(messageId: string): boolean {
    const index = this.queue.findIndex((m) => m.id === messageId)
    if (index >= 0) {
      this.queue.splice(index, 1)
      console.log(`🗑️ Removed message from queue: ${messageId}`)
      return true
    }
    return false
  }
}

export const messageQueue = new MessageQueueService()

/**
 * Example usage:
 *
 * ```typescript
 * // Setup send function
 * messageQueue.setSendFunction(async (message) => {
 *   await websocketService.sendMessage(message.content)
 * })
 *
 * // When sending a message
 * if (offlineDetector.isCurrentlyOffline()) {
 *   messageQueue.enqueue(content, sessionId)
 *   showNotification('Message queued, will send when online')
 * } else {
 *   await websocketService.sendMessage(content)
 * }
 * ```
 */
