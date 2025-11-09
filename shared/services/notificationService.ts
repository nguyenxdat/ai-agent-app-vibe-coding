/**
 * Notification Service
 * Platform-agnostic notification adapter
 * Supports both Web Notifications API and Electron notifications
 */

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  silent?: boolean
  requireInteraction?: boolean
}

export interface NotificationService {
  /**
   * Check if notifications are supported and permission is granted
   */
  isSupported(): boolean

  /**
   * Request notification permission (Web only)
   */
  requestPermission(): Promise<boolean>

  /**
   * Show a notification
   */
  show(options: NotificationOptions): Promise<void>

  /**
   * Check current permission status
   */
  getPermission(): 'granted' | 'denied' | 'default'
}

/**
 * Web Notifications Implementation
 */
class WebNotificationService implements NotificationService {
  isSupported(): boolean {
    return 'Notification' in window
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  getPermission(): 'granted' | 'denied' | 'default' {
    if (!this.isSupported()) {
      return 'denied'
    }
    return Notification.permission
  }

  async show(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser')
      return
    }

    if (this.getPermission() !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        console.warn('Notification permission denied')
        return
      }
    }

    new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      silent: options.silent,
      requireInteraction: options.requireInteraction,
    })
  }
}

/**
 * Electron Notifications Implementation
 */
class ElectronNotificationService implements NotificationService {
  isSupported(): boolean {
    return !!(window as any).electron?.notification
  }

  async requestPermission(): Promise<boolean> {
    // Electron doesn't require permission
    return this.isSupported()
  }

  getPermission(): 'granted' | 'denied' | 'default' {
    return this.isSupported() ? 'granted' : 'denied'
  }

  async show(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Electron notifications not available')
      return
    }

    try {
      await (window as any).electron.notification.show({
        title: options.title,
        body: options.body,
        icon: options.icon,
        silent: options.silent,
      })
    } catch (error) {
      console.error('Failed to show Electron notification:', error)
    }
  }
}

/**
 * Factory function to create appropriate notification service
 */
export function createNotificationService(): NotificationService {
  // Check if running in Electron
  if ((window as any).electron?.isElectron) {
    return new ElectronNotificationService()
  }

  // Default to Web Notifications
  return new WebNotificationService()
}

/**
 * Singleton instance
 */
export const notificationService = createNotificationService()
