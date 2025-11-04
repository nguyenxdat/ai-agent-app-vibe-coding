/**
 * Settings Page Component
 * Main page for managing agent configurations
 */

import { useState, useEffect } from 'react'
import { MainLayout, Header, Sidebar, SidebarHeader, SidebarContent } from '../components/layouts/MainLayout'
import { Button } from '../components/ui/button'
import { AgentConfigList } from '../components/settings/AgentConfigList'
import { AgentConfigForm } from '../components/settings/AgentConfigForm'
import { agentApi } from '../services/agentApi'
import type { AgentConfiguration } from '@shared/types/agent'

interface SettingsPageProps {
  onBack?: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
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
        alert(`✅ Connection successful!\nLatency: ${result.latency}ms`)
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
    <MainLayout
      header={
        <Header
          title="Settings"
          actions={
            <>
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
              {!showForm && (
                <Button onClick={handleAddAgent}>
                  Add Agent
                </Button>
              )}
            </>
          }
        />
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold">Settings</h2>
          </SidebarHeader>
          <SidebarContent>
            <nav className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded bg-accent">
                Agents
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-accent">
                General
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-accent">
                Appearance
              </button>
            </nav>
          </SidebarContent>
        </Sidebar>
      }
    >
      <div className="p-6">
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
    </MainLayout>
  )
}
