/**
 * Agent Configuration Form Component
 * Form for creating/editing agent configurations
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { AgentConfiguration } from '@shared/types/agent'

interface AgentConfigFormProps {
  agent?: AgentConfiguration
  onSave: (agent: Partial<AgentConfiguration>) => Promise<void>
  onCancel: () => void
}

export function AgentConfigForm({ agent, onSave, onCancel }: AgentConfigFormProps) {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    endpointUrl: agent?.endpointUrl || '',
    authToken: agent?.authToken || '',
    isActive: agent?.isActive ?? true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Agent name is required')
      return
    }

    if (!formData.endpointUrl.trim()) {
      setError('Endpoint URL is required')
      return
    }

    try {
      new URL(formData.endpointUrl)
    } catch {
      setError('Invalid URL format')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        endpointUrl: formData.endpointUrl.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</CardTitle>
        <CardDescription>
          {agent ? 'Update agent configuration' : 'Configure a new AI agent connection'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Agent Name *
            </label>
            <Input
              id="name"
              type="text"
              placeholder="My AI Agent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Endpoint URL */}
          <div className="space-y-2">
            <label htmlFor="endpointUrl" className="text-sm font-medium">
              Endpoint URL *
            </label>
            <Input
              id="endpointUrl"
              type="url"
              placeholder="https://agent.example.com"
              value={formData.endpointUrl}
              onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              A2A protocol endpoint URL
            </p>
          </div>

          {/* Auth Token */}
          <div className="space-y-2">
            <label htmlFor="authToken" className="text-sm font-medium">
              Authentication Token (Optional)
            </label>
            <Input
              id="authToken"
              type="password"
              placeholder="••••••••••••••••"
              value={formData.authToken}
              onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if no authentication required
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : agent ? 'Update' : 'Add Agent'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
