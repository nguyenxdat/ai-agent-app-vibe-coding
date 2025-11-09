/**
 * Secure Storage Service
 * Wraps storage with encryption for sensitive data like auth tokens
 */

import { encrypt, decrypt } from '../utils/encryption'
import { getStorageAdapter } from './storage/storageFactory'
import type { StorageAdapter } from './storage/types'

class SecureStorageService {
  private storage: StorageAdapter | null = null

  private async ensureStorage(): Promise<StorageAdapter> {
    if (!this.storage) {
      this.storage = await getStorageAdapter()
    }
    return this.storage
  }

  /**
   * Store a value securely (encrypted)
   */
  async setSecure(key: string, value: string): Promise<void> {
    const storage = await this.ensureStorage()
    try {
      const encrypted = await encrypt(value)
      await storage.setItem(key, encrypted)
    } catch (error) {
      console.error('Failed to store securely:', error)
      // Fallback: store unencrypted (warn user)
      console.warn('⚠️ Storing value unencrypted due to encryption failure')
      await storage.setItem(key, value)
    }
  }

  /**
   * Retrieve a secure value (decrypted)
   */
  async getSecure(key: string): Promise<string | null> {
    const storage = await this.ensureStorage()
    try {
      const encrypted = await storage.getItem(key)
      if (!encrypted) return null

      const decrypted = await decrypt(encrypted)
      return decrypted
    } catch (error) {
      console.error('Failed to decrypt value:', error)
      // Fallback: try to read as plain text (for backward compatibility)
      return await storage.getItem(key)
    }
  }

  /**
   * Remove a secure value
   */
  async removeSecure(key: string): Promise<void> {
    const storage = await this.ensureStorage()
    await storage.removeItem(key)
  }

  /**
   * Store agent auth token securely
   */
  async setAgentToken(agentId: string, token: string): Promise<void> {
    const key = `agent_token_${agentId}`
    await this.setSecure(key, token)
  }

  /**
   * Retrieve agent auth token
   */
  async getAgentToken(agentId: string): Promise<string | null> {
    const key = `agent_token_${agentId}`
    return await this.getSecure(key)
  }

  /**
   * Remove agent auth token
   */
  async removeAgentToken(agentId: string): Promise<void> {
    const key = `agent_token_${agentId}`
    await this.removeSecure(key)
  }

  /**
   * Store API key securely
   */
  async setApiKey(service: string, apiKey: string): Promise<void> {
    const key = `api_key_${service}`
    await this.setSecure(key, apiKey)
  }

  /**
   * Retrieve API key
   */
  async getApiKey(service: string): Promise<string | null> {
    const key = `api_key_${service}`
    return await this.getSecure(key)
  }

  /**
   * Remove API key
   */
  async removeApiKey(service: string): Promise<void> {
    const key = `api_key_${service}`
    await this.removeSecure(key)
  }

  /**
   * Clear all secure data
   */
  async clearAllSecure(): Promise<void> {
    const storage = await this.ensureStorage()
    const keys = await storage.getAllKeys()

    // Remove all encrypted keys
    const secureKeys = keys.filter(
      (key) =>
        key.startsWith('agent_token_') ||
        key.startsWith('api_key_') ||
        key.endsWith('_encrypted')
    )

    for (const key of secureKeys) {
      await storage.removeItem(key)
    }
  }
}

export const secureStorage = new SecureStorageService()

/**
 * Example usage:
 *
 * ```typescript
 * // Store agent token securely
 * await secureStorage.setAgentToken('agent-123', 'secret-token')
 *
 * // Retrieve agent token
 * const token = await secureStorage.getAgentToken('agent-123')
 *
 * // Store API key
 * await secureStorage.setApiKey('openai', 'sk-...')
 *
 * // Retrieve API key
 * const apiKey = await secureStorage.getApiKey('openai')
 *
 * // Clear all secure data
 * await secureStorage.clearAllSecure()
 * ```
 */
