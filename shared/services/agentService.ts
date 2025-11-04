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
    if (updates.name && updates.name !== configs[index].name) {
      const existing = await this.getByName(updates.name)
      if (existing) {
        throw new Error(`Agent với name "${updates.name}" đã tồn tại`)
      }
    }

    // Update config
    configs[index] = {
      ...configs[index],
      ...updates,
    }

    await storage.setItem(STORAGE_KEYS.AGENT_CONFIGS, configs)
    return configs[index]
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
   * Validate agent endpoint accessibility
   */
  async validateEndpoint(endpointUrl: string): Promise<{
    valid: boolean
    message: string
    latency?: number
  }> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${endpointUrl}/api/v1/a2a/agent-card`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const latency = Date.now() - startTime

      if (!response.ok) {
        return {
          valid: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          latency,
        }
      }

      return {
        valid: true,
        message: 'Agent endpoint accessible',
        latency,
      }
    } catch (error) {
      const latency = Date.now() - startTime

      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latency,
      }
    }
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
