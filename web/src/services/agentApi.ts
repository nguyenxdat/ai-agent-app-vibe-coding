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
}

export interface AgentUpdateRequest {
  name?: string
  endpointUrl?: string
  authToken?: string
  capabilities?: string[]
  isActive?: boolean
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
}

class AgentApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || error.message || 'Request failed')
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
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
    return this.request<ValidateResponse>(`/api/v1/agents/${id}/validate`, {
      method: 'POST',
    })
  }

  async validateUrl(url: string): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('/api/v1/agents/validate', {
      method: 'POST',
      body: JSON.stringify({ endpointUrl: url }),
    })
  }
}

export const agentApi = new AgentApiService()
