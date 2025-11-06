/**
 * AgentSelector Component
 * Dropdown to select active agent (replaces "Select workspace")
 */

import type { AgentConfiguration } from '@shared/types/agent'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface AgentSelectorProps {
  agents: AgentConfiguration[]
  selectedAgent: AgentConfiguration | null
  onSelectAgent: (agent: AgentConfiguration) => void
  isLoading?: boolean
}

export function AgentSelector({
  agents,
  selectedAgent,
  onSelectAgent,
  isLoading = false,
}: AgentSelectorProps) {
  if (isLoading) {
    return (
      <div className="w-full p-3 rounded-lg border bg-background text-muted-foreground text-sm">
        Loading agents...
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="w-full p-3 rounded-lg border bg-background text-muted-foreground text-sm">
        No agents available
      </div>
    )
  }

  return (
    <Select
      value={selectedAgent?.id || ''}
      onValueChange={(value) => {
        const agent = agents.find((a) => a.id === value)
        if (agent) onSelectAgent(agent)
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select workspace..." />
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{agent.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
