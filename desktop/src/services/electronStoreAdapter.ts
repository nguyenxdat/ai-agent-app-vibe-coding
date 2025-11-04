/**
 * Electron Store adapter for Desktop platform
 * Uses electron-store for persistent storage with encryption
 */

import type { StorageAdapter } from '../../../shared/services/storage/types'

// Electron store will be initialized in main process
// This is a placeholder implementation that communicates with main process via IPC

export class ElectronStoreAdapter implements StorageAdapter {
  async getItem<T = unknown>(key: string): Promise<T | null> {
    try {
      // In real implementation, this will use electron IPC
      // For now, fallback to localStorage as placeholder
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key)
        if (item === null) return null
        return JSON.parse(item) as T
      }
      return null
    } catch (error) {
      console.error(`Error getting item ${key} from Electron store:`, error)
      return null
    }
  }

  async setItem<T = unknown>(key: string, value: T): Promise<void> {
    try {
      // In real implementation, this will use electron IPC
      // For now, fallback to localStorage as placeholder
      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = JSON.stringify(value)
        window.localStorage.setItem(key, serialized)
      }
    } catch (error) {
      console.error(`Error setting item ${key} in Electron store:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing item ${key} from Electron store:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear()
      }
    } catch (error) {
      console.error('Error clearing Electron store:', error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Object.keys(window.localStorage)
      }
      return []
    } catch (error) {
      console.error('Error getting Electron store keys:', error)
      return []
    }
  }

  async hasItem(key: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key) !== null
      }
      return false
    } catch (error) {
      console.error(`Error checking if item ${key} exists in Electron store:`, error)
      return false
    }
  }
}

// Note: Full Electron implementation will require:
// 1. Install electron-store package
// 2. Setup IPC handlers in main process
// 3. Update this adapter to use IPC communication
// For Phase 2, this placeholder allows development to continue
