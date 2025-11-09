/**
 * Offline Detection Utility
 * Detects when user goes offline and provides hooks for handling
 */

type OfflineHandler = (isOffline: boolean) => void

class OfflineDetector {
  private handlers: Set<OfflineHandler> = new Set()
  private isOffline = false

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize with current status
      this.isOffline = !navigator.onLine

      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  private handleOnline = () => {
    console.log('🌐 Network: Online')
    this.isOffline = false
    this.notifyHandlers(false)
  }

  private handleOffline = () => {
    console.log('📡 Network: Offline')
    this.isOffline = true
    this.notifyHandlers(true)
  }

  private notifyHandlers(isOffline: boolean) {
    this.handlers.forEach((handler) => {
      try {
        handler(isOffline)
      } catch (error) {
        console.error('Error in offline handler:', error)
      }
    })
  }

  /**
   * Subscribe to offline status changes
   */
  subscribe(handler: OfflineHandler): () => void {
    this.handlers.add(handler)
    // Immediately call with current status
    handler(this.isOffline)

    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler)
    }
  }

  /**
   * Check if currently offline
   */
  isCurrentlyOffline(): boolean {
    return this.isOffline
  }

  /**
   * Check if currently online
   */
  isCurrentlyOnline(): boolean {
    return !this.isOffline
  }

  /**
   * Cleanup
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    this.handlers.clear()
  }
}

// Singleton instance
export const offlineDetector = new OfflineDetector()

/**
 * React hook for offline detection
 */
export function useOfflineDetection(onOfflineChange?: (isOffline: boolean) => void) {
  if (typeof window === 'undefined') return false

  const [isOffline, setIsOffline] = React.useState(offlineDetector.isCurrentlyOffline())

  React.useEffect(() => {
    const unsubscribe = offlineDetector.subscribe((offline) => {
      setIsOffline(offline)
      onOfflineChange?.(offline)
    })

    return unsubscribe
  }, [onOfflineChange])

  return isOffline
}

// Import React for hook
import React from 'react'
