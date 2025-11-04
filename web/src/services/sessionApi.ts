/**
 * Session API Service
 * HTTP client for chat session endpoints
 */

import type { ChatSession, ChatMessage } from '@shared/types/chat'

const API_BASE_URL = 'http://localhost:8000'

export interface CreateSessionRequest {
  agent_id: string
  user_id: string
  title?: string
}

export interface UpdateSessionRequest {
  title?: string
  is_active?: boolean
}

class SessionApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || error.message || 'Request failed')
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async createSession(data: CreateSessionRequest): Promise<ChatSession> {
    return this.request<ChatSession>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSessions(filters?: {
    user_id?: string
    agent_id?: string
  }): Promise<ChatSession[]> {
    const params = new URLSearchParams()
    if (filters?.user_id) params.append('user_id', filters.user_id)
    if (filters?.agent_id) params.append('agent_id', filters.agent_id)

    const query = params.toString()
    return this.request<ChatSession[]>(
      `/api/v1/sessions${query ? `?${query}` : ''}`
    )
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    return this.request<ChatSession>(`/api/v1/sessions/${sessionId}`)
  }

  async updateSession(
    sessionId: string,
    data: UpdateSessionRequest
  ): Promise<ChatSession> {
    return this.request<ChatSession>(`/api/v1/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  }

  async getMessages(
    sessionId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ChatMessage[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    const query = params.toString()
    return this.request<ChatMessage[]>(
      `/api/v1/sessions/${sessionId}/messages${query ? `?${query}` : ''}`
    )
  }

  async sendMessage(
    sessionId: string,
    content: string,
    role: 'user' | 'agent' | 'system' = 'user'
  ): Promise<ChatMessage> {
    return this.request<ChatMessage>(
      `/api/v1/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, role }),
      }
    )
  }
}

export const sessionApi = new SessionApiService()
