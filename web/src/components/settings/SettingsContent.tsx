/**
 * SettingsContent Component
 * Settings panel content for agent management
 */

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { AgentConfigList } from './AgentConfigList'
import { AgentConfigForm } from './AgentConfigForm'
import { agentApi } from '../../services/agentApi'
import type { AgentConfiguration } from '@shared/types/agent'

interface SettingsContentProps {
  onAgentsChange?: () => void
}

export function SettingsContent({ onAgentsChange }: SettingsContentProps) {
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentConfiguration | undefined>()

  // Load agents
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await agentApi.getAllAgents()
      setAgents(data)
      onAgentsChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAgent = () => {
    setEditingAgent(undefined)
    setShowForm(true)
  }

  const handleEditAgent = (agent: AgentConfiguration) => {
    setEditingAgent(agent)
    setShowForm(true)
  }

  const handleSaveAgent = async (agentData: Partial<AgentConfiguration>) => {
    try {
      if (editingAgent) {
        // Update existing agent
        await agentApi.updateAgent(editingAgent.id, agentData)
      } else {
        // Create new agent
        await agentApi.createAgent({
          name: agentData.name!,
          endpointUrl: agentData.endpointUrl!,
          authToken: agentData.authToken,
          isActive: agentData.isActive ?? true,
        })
      }

      setShowForm(false)
      setEditingAgent(undefined)
      await loadAgents()
    } catch (err) {
      throw err // Re-throw to let form handle the error
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return
    }

    try {
      await agentApi.deleteAgent(agentId)
      await loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
    }
  }

  const handleValidateAgent = async (agentId: string) => {
    try {
      const result = await agentApi.validateAgent(agentId)

      if (result.valid) {
        alert(`✅ Connection successful!\nLatency: ${result.latency}ms\n${result.message}`)
      } else {
        alert(`❌ Connection failed\n${result.message}`)
      }
    } catch (err) {
      alert(`❌ Validation error\n${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingAgent(undefined)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Agent Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your AI agent configurations
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleAddAgent}>
              Add Agent
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm ? (
          <div className="max-w-2xl">
            <AgentConfigForm
              agent={editingAgent}
              onSave={handleSaveAgent}
              onCancel={handleCancelForm}
            />
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : (
          <AgentConfigList
            agents={agents}
            onEdit={handleEditAgent}
            onDelete={handleDeleteAgent}
            onValidate={handleValidateAgent}
          />
        )}
      </div>
    </div>
  )
}
