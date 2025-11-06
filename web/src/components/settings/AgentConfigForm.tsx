/**
 * Agent Configuration Form Component
 * Form for creating/editing agent configurations
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { AgentConfiguration } from '@shared/types/agent'
import { agentApi } from '../../services/agentApi'

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
    selectedModel: agent?.selectedModel || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>(agent?.availableModels || [])
  const [error, setError] = useState<string | null>(null)
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null)
  const [showAuthToken, setShowAuthToken] = useState(false)

  const handleValidateEndpoint = async () => {
    if (!formData.endpointUrl.trim()) {
      setError('Please enter an endpoint URL first')
      return
    }

    try {
      new URL(formData.endpointUrl)
    } catch {
      setError('Invalid URL format')
      return
    }

    setIsValidating(true)
    setError(null)
    setValidationSuccess(null)

    try {
      const result = await agentApi.validateUrl(
        formData.endpointUrl.trim(),
        formData.authToken.trim() || undefined
      )

      if (result.valid) {
        setValidationSuccess(result.message)
        // Update available models if returned
        if (result.availableModels && result.availableModels.length > 0) {
          setAvailableModels(result.availableModels)
          // Auto-select first model if none selected
          if (!formData.selectedModel) {
            setFormData({ ...formData, selectedModel: result.availableModels[0] })
          }
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }

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
        selectedModel: formData.selectedModel || undefined,
        availableModels: availableModels.length > 0 ? availableModels : undefined,
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

          {validationSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded text-sm border border-green-200">
              {validationSuccess}
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
            <div className="flex gap-2">
              <Input
                id="endpointUrl"
                type="url"
                placeholder="https://agent.example.com"
                value={formData.endpointUrl}
                onChange={(e) => {
                  setFormData({ ...formData, endpointUrl: e.target.value })
                  setValidationSuccess(null)
                  setAvailableModels([])
                }}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleValidateEndpoint}
                disabled={isValidating || !formData.endpointUrl.trim()}
              >
                {isValidating ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A2A protocol or OpenAI-compatible endpoint URL
            </p>
          </div>

          {/* Auth Token */}
          <div className="space-y-2">
            <label htmlFor="authToken" className="text-sm font-medium">
              Authentication Token (Optional)
            </label>
            <div className="relative">
              <Input
                id="authToken"
                type={showAuthToken ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                value={formData.authToken}
                onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAuthToken ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty if no authentication required
            </p>
          </div>

          {/* Model Selection */}
          {availableModels.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="selectedModel" className="text-sm font-medium">
                Model
              </label>
              <select
                id="selectedModel"
                value={formData.selectedModel}
                onChange={(e) => setFormData({ ...formData, selectedModel: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Select a model...</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Choose the AI model to use for this agent
              </p>
            </div>
          )}

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
