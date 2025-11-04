/**
 * Agent Configuration List Component
 * Displays all configured agents
 */

import { AgentConfigCard } from './AgentConfigCard'
import type { AgentConfiguration } from '@shared/types/agent'

interface AgentConfigListProps {
  agents: AgentConfiguration[]
  onEdit: (agent: AgentConfiguration) => void
  onDelete: (agentId: string) => void
  onValidate: (agentId: string) => Promise<void>
}

export function AgentConfigList({ agents, onEdit, onDelete, onValidate }: AgentConfigListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Chưa có agent nào được cấu hình
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Click "Add Agent" để thêm agent mới
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentConfigCard
          key={agent.id}
          agent={agent}
          onEdit={onEdit}
          onDelete={onDelete}
          onValidate={onValidate}
        />
      ))}
    </div>
  )
}
