/**
 * localStorage adapter for Web platform
 */

import type { StorageAdapter } from './types'

export class LocalStorageAdapter implements StorageAdapter {
  async getItem<T = unknown>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return null

      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error)
      return null
    }
  }

  async setItem<T = unknown>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error('Error getting localStorage keys:', error)
      return []
    }
  }

  async hasItem(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null
    } catch (error) {
      console.error(`Error checking if item ${key} exists in localStorage:`, error)
      return false
    }
  }
}
