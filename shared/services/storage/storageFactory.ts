/**
 * Storage Factory
 * Provides platform-specific storage adapter
 */

import type { StorageAdapter } from './types'
import { LocalStorageAdapter } from './localStorageAdapter'

// Detect platform
function detectPlatform(): 'web' | 'desktop' {
  // Check if running in Electron
  if (
    typeof window !== 'undefined' &&
    window.process &&
    (window.process as { type?: string }).type === 'renderer'
  ) {
    return 'desktop'
  }

  // Check if electron API is available
  if (typeof window !== 'undefined' && (window as { electron?: unknown }).electron) {
    return 'desktop'
  }

  // Default to web
  return 'web'
}

// Lazy load desktop adapter to avoid bundling it in web
async function getDesktopAdapter(): Promise<StorageAdapter> {
  const { ElectronStoreAdapter } = await import(
    '../../../desktop/src/services/electronStoreAdapter'
  )
  return new ElectronStoreAdapter()
}

// Storage factory singleton
let storageInstance: StorageAdapter | null = null

export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (storageInstance) {
    return storageInstance
  }

  const platform = detectPlatform()

  if (platform === 'desktop') {
    storageInstance = await getDesktopAdapter()
  } else {
    storageInstance = new LocalStorageAdapter()
  }

  return storageInstance
}

// Synchronous version for cases where platform is known
export function getStorageAdapterSync(): StorageAdapter {
  const platform = detectPlatform()

  if (platform === 'web') {
    return new LocalStorageAdapter()
  }

  // For desktop, return LocalStorage as fallback if not initialized
  // Proper desktop adapter should be initialized async first
  console.warn('Using LocalStorage fallback for desktop - call getStorageAdapter() async first')
  return new LocalStorageAdapter()
}

// Export for testing
export { detectPlatform }
