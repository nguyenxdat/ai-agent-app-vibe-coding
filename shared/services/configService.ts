/**
 * Config Service
 * Manages application settings và configuration
 */

import type { StorageAdapter } from './storage/types'
import { STORAGE_KEYS } from './storage/types'
import { getStorageAdapter } from './storage/storageFactory'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: boolean
  soundEnabled: boolean
  defaultAgentId?: string
  autoSaveInterval: number // seconds
  maxMessagesPerSession: number
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'vi',
  notifications: true,
  soundEnabled: true,
  autoSaveInterval: 30,
  maxMessagesPerSession: 1000,
}

export class ConfigService {
  private storage: StorageAdapter | null = null
  private settingsCache: AppSettings | null = null

  async initialize(): Promise<void> {
    this.storage = await getStorageAdapter()
    await this.loadSettings()
  }

  private async ensureStorage(): Promise<StorageAdapter> {
    if (!this.storage) {
      await this.initialize()
    }
    return this.storage!
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    const storage = await this.ensureStorage()
    const stored = await storage.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS)

    this.settingsCache = {
      ...DEFAULT_SETTINGS,
      ...stored,
    }
  }

  /**
   * Get all settings
   */
  async getSettings(): Promise<AppSettings> {
    if (!this.settingsCache) {
      await this.loadSettings()
    }
    return { ...this.settingsCache! }
  }

  /**
   * Get single setting
   */
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getSettings()
    return settings[key]
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const storage = await this.ensureStorage()
    const current = await this.getSettings()

    const updated = {
      ...current,
      ...updates,
    }

    await storage.setItem(STORAGE_KEYS.APP_SETTINGS, updated)
    this.settingsCache = updated

    return updated
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<AppSettings> {
    const storage = await this.ensureStorage()
    await storage.setItem(STORAGE_KEYS.APP_SETTINGS, DEFAULT_SETTINGS)
    this.settingsCache = { ...DEFAULT_SETTINGS }

    return this.settingsCache
  }

  /**
   * Get theme
   */
  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    return await this.getSetting('theme')
  }

  /**
   * Set theme
   */
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.updateSettings({ theme })

    // Apply theme to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }
  }

  /**
   * Export configuration as JSON
   */
  async exportConfig(): Promise<string> {
    const settings = await this.getSettings()
    return JSON.stringify(settings, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  async importConfig(jsonString: string): Promise<AppSettings> {
    try {
      const imported = JSON.parse(jsonString) as Partial<AppSettings>
      return await this.updateSettings(imported)
    } catch (error) {
      throw new Error('Invalid configuration JSON')
    }
  }
}

// Singleton instance
export const configService = new ConfigService()
