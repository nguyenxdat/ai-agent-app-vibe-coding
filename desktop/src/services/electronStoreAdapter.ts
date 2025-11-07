/**
 * Electron Store Adapter
 * Storage adapter using electron-store for persistent data in desktop app
 * Communicates with main process via IPC for secure storage
 */

import type { StorageAdapter } from '../../../shared/services/storage/types'

export class ElectronStoreAdapter implements StorageAdapter {
  private isElectron: boolean

  constructor() {
    this.isElectron = !!window.electron
    if (!this.isElectron) {
      console.warn('[ElectronStoreAdapter] Electron APIs not available, falling back to localStorage')
    }
  }

  async getItem<T = unknown>(key: string): Promise<T | null> {
    try {
      if (this.isElectron) {
        const value = await window.electron.storage.get(key)
        if (value === undefined || value === null) {
          return null
        }
        // electron-store returns values directly (already parsed)
        return value as T
      } else {
        // Fallback to localStorage
        const item = window.localStorage?.getItem(key)
        if (item === null) return null
        return JSON.parse(item) as T
      }
    } catch (error) {
      console.error(`[ElectronStoreAdapter] Error getting item ${key}:`, error)
      return null
    }
  }

  async setItem<T = unknown>(key: string, value: T): Promise<void> {
    try {
      if (this.isElectron) {
        // electron-store handles serialization
        await window.electron.storage.set(key, value)
      } else {
        // Fallback to localStorage
        const serialized = JSON.stringify(value)
        window.localStorage?.setItem(key, serialized)
      }
    } catch (error) {
      console.error(`[ElectronStoreAdapter] Error setting item ${key}:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isElectron) {
        await window.electron.storage.delete(key)
      } else {
        window.localStorage?.removeItem(key)
      }
    } catch (error) {
      console.error(`[ElectronStoreAdapter] Error removing item ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isElectron) {
        await window.electron.storage.clear()
      } else {
        window.localStorage?.clear()
      }
    } catch (error) {
      console.error('[ElectronStoreAdapter] Error clearing store:', error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (this.isElectron) {
        return await window.electron.storage.keys()
      } else {
        return Object.keys(window.localStorage || {})
      }
    } catch (error) {
      console.error('[ElectronStoreAdapter] Error getting keys:', error)
      return []
    }
  }

  async hasItem(key: string): Promise<boolean> {
    try {
      const item = await this.getItem(key)
      return item !== null
    } catch (error) {
      console.error(`[ElectronStoreAdapter] Error checking if item ${key} exists:`, error)
      return false
    }
  }
}
