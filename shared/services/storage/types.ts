/**
 * Storage adapter interface
 * Platform-agnostic storage operations
 */

export interface StorageAdapter {
  // Get item from storage
  getItem<T = unknown>(key: string): Promise<T | null>

  // Set item in storage
  setItem<T = unknown>(key: string, value: T): Promise<void>

  // Remove item from storage
  removeItem(key: string): Promise<void>

  // Clear all storage
  clear(): Promise<void>

  // Get all keys
  keys(): Promise<string[]>

  // Check if key exists
  hasItem(key: string): Promise<boolean>
}

// Storage keys constants
export const STORAGE_KEYS = {
  AGENT_CONFIGS: 'ai-chat-agent-configs',
  CHAT_SESSIONS: 'ai-chat-sessions',
  APP_SETTINGS: 'ai-chat-settings',
  THEME: 'ai-chat-theme',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
