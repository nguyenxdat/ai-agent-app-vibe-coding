/**
 * Agent Configuration Card Component
 * Displays a single agent configuration with actions
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import type { AgentConfiguration } from '@shared/types/agent'

interface AgentConfigCardProps {
  agent: AgentConfiguration
  onEdit: (agent: AgentConfiguration) => void
  onDelete: (agentId: string) => void
  onValidate: (agentId: string) => Promise<void>
}

export function AgentConfigCard({ agent, onEdit, onDelete, onValidate }: AgentConfigCardProps) {
  const [isValidating, setIsValidating] = useState(false)

  const handleValidate = async () => {
    console.log('🔍 [AgentConfigCard] Test Connection clicked for agent:', {
      id: agent.id,
      name: agent.name,
      endpointUrl: agent.endpointUrl,
    })
    setIsValidating(true)
    try {
      console.log('🔍 [AgentConfigCard] Calling onValidate...')
      await onValidate(agent.id)
      console.log('✅ [AgentConfigCard] onValidate completed successfully')
    } catch (error) {
      console.error('❌ [AgentConfigCard] onValidate failed:', error)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card className={agent.isActive ? '' : 'opacity-60'}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {agent.name}
              {!agent.isActive && (
                <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {agent.endpointUrl}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Capabilities */}
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Capabilities:</p>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-xs bg-secondary px-2 py-1 rounded"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Protocol: {agent.protocolVersion}</p>
            {agent.lastUsedAt && (
              <p>Last used: {new Date(agent.lastUsedAt).toLocaleString('vi-VN')}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Test Connection'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(agent)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(agent.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
