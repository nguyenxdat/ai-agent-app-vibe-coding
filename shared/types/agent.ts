/**
 * Agent Configuration types cho A2A connections
 */

export interface AgentConfiguration {
  id: string // UUID v4
  name: string // 3-50 characters, unique
  description?: string // Max 500 characters
  endpointUrl: string // Valid HTTP/HTTPS URL
  authToken?: string // Encrypted when stored
  capabilities?: string[] // List of agent capabilities
  isActive: boolean // Enabled/disabled status
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime
  lastUsedAt?: string // ISO 8601 datetime
  protocolVersion: string // Semantic version (e.g., "1.0.0")
  selectedModel?: string // Selected model for OpenAI-compatible APIs
  availableModels?: string[] // Available models from the agent
}

export interface AgentCard {
  name: string // 3-50 characters
  version: string // Semantic version
  description: string // Max 1000 characters
  capabilities: string[] // At least 1 capability
  endpointUrl: string // Valid HTTPS URL
  authRequirements: AuthRequirements
  protocolVersion: string // Semantic version
  provider?: ProviderInfo
}

export interface AuthRequirements {
  type: 'none' | 'bearer' | 'api_key' | 'oauth2'
  requiredFields?: string[]
}

export interface ProviderInfo {
  name: string
  email?: string
  website?: string
}

// Type guards
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function isValidAgentConfiguration(obj: unknown): obj is AgentConfiguration {
  if (!obj || typeof obj !== 'object') return false

  const config = obj as Partial<AgentConfiguration>

  return (
    typeof config.id === 'string' &&
    typeof config.name === 'string' &&
    config.name.length >= 3 &&
    config.name.length <= 50 &&
    typeof config.endpointUrl === 'string' &&
    isValidUrl(config.endpointUrl) &&
    typeof config.isActive === 'boolean' &&
    typeof config.createdAt === 'string' &&
    typeof config.protocolVersion === 'string'
  )
}

// Helper functions
export function createAgentConfiguration(
  name: string,
  endpointUrl: string,
  options?: {
    description?: string
    authToken?: string
    capabilities?: string[]
    protocolVersion?: string
  }
): AgentConfiguration {
  return {
    id: crypto.randomUUID(),
    name,
    description: options?.description,
    endpointUrl,
    authToken: options?.authToken,
    capabilities: options?.capabilities,
    isActive: true,
    createdAt: new Date().toISOString(),
    protocolVersion: options?.protocolVersion || '1.0.0',
  }
}
