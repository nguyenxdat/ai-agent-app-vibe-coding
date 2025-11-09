/**
 * Example usage of Notification Service
 *
 * This file demonstrates how to use the notification service
 * in both Web and Desktop environments
 */

import { notificationService } from './notificationService'

// Example 1: Simple notification
export async function showWelcomeNotification() {
  await notificationService.show({
    title: 'Welcome to AI Chat!',
    body: 'Your chat application is ready to use.',
  })
}

// Example 2: New message notification
export async function showNewMessageNotification(agentName: string, messagePreview: string) {
  await notificationService.show({
    title: `New message from ${agentName}`,
    body: messagePreview,
    tag: 'new-message', // Prevents duplicate notifications
  })
}

// Example 3: Error notification
export async function showErrorNotification(error: string) {
  await notificationService.show({
    title: 'Error',
    body: error,
    requireInteraction: true, // Keeps notification visible until user dismisses
  })
}

// Example 4: Silent notification
export async function showBackgroundUpdateNotification() {
  await notificationService.show({
    title: 'Update Available',
    body: 'A new version is ready to install.',
    silent: true, // No sound
  })
}

// Example 5: Check permission before showing
export async function showNotificationSafely(title: string, body: string) {
  // Check if notifications are supported
  if (!notificationService.isSupported()) {
    console.warn('Notifications not supported')
    return
  }

  // Check current permission
  const permission = notificationService.getPermission()

  if (permission === 'denied') {
    console.warn('Notification permission denied')
    return
  }

  if (permission === 'default') {
    // Request permission first
    const granted = await notificationService.requestPermission()
    if (!granted) {
      console.warn('User denied notification permission')
      return
    }
  }

  // Now show notification
  await notificationService.show({ title, body })
}
