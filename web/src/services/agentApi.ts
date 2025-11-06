/**
 * Agent API Service
 * HTTP client for agent configuration endpoints
 */

import type { AgentConfiguration } from '@shared/types/agent'

const API_BASE_URL = 'http://localhost:8000'

export interface AgentCreateRequest {
  name: string
  endpointUrl: string
  authToken?: string
  capabilities?: string[]
  isActive: boolean
  selectedModel?: string
  availableModels?: string[]
}

export interface AgentUpdateRequest {
  name?: string
  endpointUrl?: string
  authToken?: string
  capabilities?: string[]
  isActive?: boolean
  selectedModel?: string
  availableModels?: string[]
}

export interface ValidateResponse {
  valid: boolean
  message: string
  latency?: number
  agentCard?: {
    id: string
    name: string
    description: string
    capabilities: string[]
  }
  availableModels?: string[]
}

class AgentApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 [agentApi.request] ${options?.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    console.log(`📡 [agentApi.request] Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      console.error('❌ [agentApi.request] Error response:', error)
      throw new Error(error.detail || error.message || 'Request failed')
    }

    if (response.status === 204) {
      console.log('✅ [agentApi.request] 204 No Content - returning empty object')
      return {} as T
    }

    const data = await response.json()
    console.log('✅ [agentApi.request] Response data:', data)
    return data
  }

  async getAllAgents(): Promise<AgentConfiguration[]> {
    return this.request<AgentConfiguration[]>('/api/v1/agents')
  }

  async getAgent(id: string): Promise<AgentConfiguration> {
    return this.request<AgentConfiguration>(`/api/v1/agents/${id}`)
  }

  async createAgent(data: AgentCreateRequest): Promise<AgentConfiguration> {
    return this.request<AgentConfiguration>('/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAgent(id: string, data: AgentUpdateRequest): Promise<AgentConfiguration> {
    return this.request<AgentConfiguration>(`/api/v1/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAgent(id: string): Promise<void> {
    return this.request<void>(`/api/v1/agents/${id}`, {
      method: 'DELETE',
    })
  }

  async validateAgent(id: string): Promise<ValidateResponse> {
    console.log('🔍 [agentApi] validateAgent called with id:', id)
    const url = `/api/v1/agents/${id}/validate`
    console.log('🔍 [agentApi] Making POST request to:', url)

    const result = await this.request<ValidateResponse>(url, {
      method: 'POST',
    })

    console.log('📦 [agentApi] validateAgent response:', result)
    return result
  }

  async validateUrl(url: string, authToken?: string): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('/api/v1/agents/validate', {
      method: 'POST',
      body: JSON.stringify({ endpointUrl: url, authToken }),
    })
  }
}

export const agentApi = new AgentApiService()
