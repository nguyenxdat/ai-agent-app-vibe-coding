/**
 * Agent Service
 * Manages agent configurations và A2A connections
 */

import type { AgentConfiguration } from '../types/agent'
import type { StorageAdapter } from './storage/types'
import { STORAGE_KEYS } from './storage/types'
import { getStorageAdapter } from './storage/storageFactory'

export class AgentService {
  private storage: StorageAdapter | null = null

  async initialize(): Promise<void> {
    this.storage = await getStorageAdapter()
  }

  private async ensureStorage(): Promise<StorageAdapter> {
    if (!this.storage) {
      await this.initialize()
    }
    return this.storage!
  }

  /**
   * Get all agent configurations
   */
  async getAll(): Promise<AgentConfiguration[]> {
    const storage = await this.ensureStorage()
    const configs = await storage.getItem<AgentConfiguration[]>(STORAGE_KEYS.AGENT_CONFIGS)
    return configs || []
  }

  /**
   * Get agent configuration by ID
   */
  async getById(id: string): Promise<AgentConfiguration | null> {
    const configs = await this.getAll()
    return configs.find((config) => config.id === id) || null
  }

  /**
   * Get agent configuration by name
   */
  async getByName(name: string): Promise<AgentConfiguration | null> {
    const configs = await this.getAll()
    return configs.find((config) => config.name === name) || null
  }

  /**
   * Create new agent configuration
   */
  async create(config: AgentConfiguration): Promise<AgentConfiguration> {
    const storage = await this.ensureStorage()

    // Check for duplicate name
    const existing = await this.getByName(config.name)
    if (existing) {
      throw new Error(`Agent với name "${config.name}" đã tồn tại`)
    }

    // Validate URL
    try {
      new URL(config.endpointUrl)
    } catch {
      throw new Error('Invalid endpoint URL')
    }

    const configs = await this.getAll()
    configs.push(config)
    await storage.setItem(STORAGE_KEYS.AGENT_CONFIGS, configs)

    return config
  }

  /**
   * Update agent configuration
   */
  async update(id: string, updates: Partial<AgentConfiguration>): Promise<AgentConfiguration> {
    const storage = await this.ensureStorage()
    const configs = await this.getAll()

    const index = configs.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new Error(`Agent với ID "${id}" không tồn tại`)
    }

    // Check name uniqueness if name is being updated
    if (updates.name && updates.name !== configs[index]?.name) {
      const existing = await this.getByName(updates.name)
      if (existing) {
        throw new Error(`Agent với name "${updates.name}" đã tồn tại`)
      }
    }

    // Update config
    const updatedConfig: AgentConfiguration = {
      ...configs[index]!,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    configs[index] = updatedConfig

    await storage.setItem(STORAGE_KEYS.AGENT_CONFIGS, configs)
    return updatedConfig
  }

  /**
   * Delete agent configuration
   */
  async delete(id: string): Promise<void> {
    const storage = await this.ensureStorage()
    const configs = await this.getAll()

    const filtered = configs.filter((c) => c.id !== id)

    if (filtered.length === configs.length) {
      throw new Error(`Agent với ID "${id}" không tồn tại`)
    }

    await storage.setItem(STORAGE_KEYS.AGENT_CONFIGS, filtered)
  }

  /**
   * Validate agent endpoint accessibility with retry logic
   */
  async validateEndpoint(
    endpointUrl: string,
    retries = 2
  ): Promise<{
    valid: boolean
    message: string
    latency?: number
    protocol?: 'a2a' | 'http-fallback'
  }> {
    const startTime = Date.now()

    // Try A2A endpoint first
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${endpointUrl}/api/v1/a2a/agent-card`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        const latency = Date.now() - startTime

        if (response.ok) {
          return {
            valid: true,
            message: 'Agent endpoint accessible',
            latency,
            protocol: 'a2a',
          }
        }

        // If 404, try fallback
        if (response.status === 404) {
          console.log(`A2A endpoint not found, attempting HTTP fallback...`)
          return await this.validateHttpFallback(endpointUrl, startTime)
        }

        // For other errors, check if retryable
        if (this.isRetryableError(response.status) && attempt < retries) {
          console.log(
            `Validation attempt ${attempt + 1} failed with status ${response.status}, retrying...`
          )
          await this.delay(1000 * (attempt + 1)) // Exponential backoff
          continue
        }

        return {
          valid: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          latency,
        }
      } catch (error) {
        const latency = Date.now() - startTime

        // Check if error is retryable (network errors, timeouts)
        if (this.isRetryableNetworkError(error) && attempt < retries) {
          console.log(`Validation attempt ${attempt + 1} failed, retrying...`, error)
          await this.delay(1000 * (attempt + 1))
          continue
        }

        // Last attempt or non-retryable error
        if (attempt === retries) {
          // Try HTTP fallback as last resort
          console.log(`A2A validation failed, attempting HTTP fallback...`)
          return await this.validateHttpFallback(endpointUrl, startTime)
        }

        return {
          valid: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          latency,
        }
      }
    }

    // Should not reach here, but return error just in case
    return {
      valid: false,
      message: 'Validation failed after all retries',
      latency: Date.now() - startTime,
    }
  }

  /**
   * Validate HTTP fallback endpoint
   */
  private async validateHttpFallback(
    endpointUrl: string,
    startTime: number
  ): Promise<{
    valid: boolean
    message: string
    latency?: number
    protocol?: 'a2a' | 'http-fallback'
  }> {
    try {
      // Try standard health/status endpoint
      const response = await fetch(`${endpointUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      const latency = Date.now() - startTime

      if (response.ok) {
        return {
          valid: true,
          message: 'HTTP fallback endpoint accessible (A2A protocol not supported)',
          latency,
          protocol: 'http-fallback',
        }
      }

      return {
        valid: false,
        message: `HTTP fallback failed: ${response.status}`,
        latency,
      }
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'HTTP fallback unavailable',
        latency: Date.now() - startTime,
      }
    }
  }

  /**
   * Check if HTTP status code is retryable
   */
  private isRetryableError(status: number): boolean {
    // Retry on server errors and rate limiting
    return status === 429 || status === 503 || status === 504 || (status >= 500 && status < 600)
  }

  /**
   * Check if network error is retryable
   */
  private isRetryableNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()

    // Retry on network errors, timeouts, connection issues
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('aborted') ||
      message.includes('connection') ||
      message.includes('fetch')
    )
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    await this.update(id, {
      lastUsedAt: new Date().toISOString(),
    })
  }
}

// Singleton instance
export const agentService = new AgentService()
