/**
 * Configuration Import/Export Utilities
 * Allows users to backup and restore agent configurations
 */

import type { AgentConfiguration } from '../types/agent'

export interface ExportData {
  version: string
  exportedAt: string
  agents: AgentConfiguration[]
  metadata?: {
    appVersion?: string
    platform?: string
    [key: string]: any
  }
}

/**
 * Export agent configurations to JSON
 */
export function exportConfigurations(agents: AgentConfiguration[]): string {
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    agents: agents.map((agent) => ({
      ...agent,
      // Remove sensitive data before export
      authToken: agent.authToken ? '***REDACTED***' : undefined,
    })),
    metadata: {
      appVersion: '1.0.0',
      platform: typeof window !== 'undefined' ? 'web' : 'desktop',
    },
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download configuration as JSON file
 */
export function downloadConfiguration(agents: AgentConfiguration[], filename?: string): void {
  const json = exportConfigurations(agents)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `ai-chat-config-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Import configurations from JSON string
 */
export function importConfigurations(jsonString: string): AgentConfiguration[] {
  try {
    const data = JSON.parse(jsonString) as ExportData

    // Validate format
    if (!data.version || !Array.isArray(data.agents)) {
      throw new Error('Invalid configuration format')
    }

    // Check version compatibility
    if (data.version !== '1.0.0') {
      console.warn(`Configuration version ${data.version} may not be fully compatible`)
    }

    // Return agents (note: authTokens will be redacted)
    return data.agents.map((agent) => ({
      ...agent,
      // Clear redacted tokens
      authToken: agent.authToken === '***REDACTED***' ? undefined : agent.authToken,
    }))
  } catch (error) {
    throw new Error(`Failed to import configurations: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Read configuration from file
 */
export async function readConfigurationFile(file: File): Promise<AgentConfiguration[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const agents = importConfigurations(content)
        resolve(agents)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Validate imported configuration
 */
export function validateConfiguration(agents: AgentConfiguration[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(agents)) {
    errors.push('Configuration must be an array of agents')
    return { valid: false, errors, warnings }
  }

  agents.forEach((agent, index) => {
    // Check required fields
    if (!agent.id) {
      errors.push(`Agent ${index + 1}: Missing required field 'id'`)
    }
    if (!agent.name) {
      errors.push(`Agent ${index + 1}: Missing required field 'name'`)
    }
    if (!agent.endpointUrl) {
      errors.push(`Agent ${index + 1}: Missing required field 'endpointUrl'`)
    }

    // Check URL format
    if (agent.endpointUrl) {
      try {
        new URL(agent.endpointUrl)
      } catch {
        errors.push(`Agent ${index + 1}: Invalid URL format '${agent.endpointUrl}'`)
      }
    }

    // Warnings for redacted tokens
    if (agent.authToken === '***REDACTED***') {
      warnings.push(`Agent ${index + 1} (${agent.name}): Authentication token was redacted during export. You'll need to re-enter it.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Merge imported configurations with existing ones
 */
export function mergeConfigurations(
  existing: AgentConfiguration[],
  imported: AgentConfiguration[],
  strategy: 'replace' | 'merge' | 'keep-existing' = 'merge'
): AgentConfiguration[] {
  if (strategy === 'replace') {
    return imported
  }

  if (strategy === 'keep-existing') {
    const existingIds = new Set(existing.map((a) => a.id))
    const newAgents = imported.filter((a) => !existingIds.has(a.id))
    return [...existing, ...newAgents]
  }

  // Merge strategy (default)
  const merged = [...existing]
  const existingMap = new Map(existing.map((a) => [a.id, a]))

  imported.forEach((importedAgent) => {
    const existingIndex = merged.findIndex((a) => a.id === importedAgent.id)

    if (existingIndex >= 0) {
      // Update existing agent (keep authToken if redacted in import)
      merged[existingIndex] = {
        ...importedAgent,
        authToken:
          importedAgent.authToken === '***REDACTED***'
            ? merged[existingIndex].authToken
            : importedAgent.authToken,
      }
    } else {
      // Add new agent
      merged.push(importedAgent)
    }
  })

  return merged
}

/**
 * Example usage:
 *
 * ```typescript
 * // Export
 * const agents = await agentApi.getAllAgents()
 * downloadConfiguration(agents)
 *
 * // Import from file
 * const fileInput = document.createElement('input')
 * fileInput.type = 'file'
 * fileInput.accept = '.json'
 * fileInput.onchange = async (e) => {
 *   const file = (e.target as HTMLInputElement).files?.[0]
 *   if (file) {
 *     const imported = await readConfigurationFile(file)
 *     const validation = validateConfiguration(imported)
 *
 *     if (validation.valid) {
 *       const merged = mergeConfigurations(existingAgents, imported, 'merge')
 *       // Save merged configurations
 *     } else {
 *       console.error('Validation errors:', validation.errors)
 *     }
 *   }
 * }
 * fileInput.click()
 * ```
 */
