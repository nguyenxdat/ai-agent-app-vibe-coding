/**
 * ChatSidebar Component
 * Middle panel with agent selector, new chat button, search, and chat list
 */

import { Plus, Search, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { AgentSelector } from './AgentSelector'
import type { AgentConfiguration } from '@shared/types/agent'
import type { ChatSession } from '@shared/types/chat'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  agents: AgentConfiguration[]
  selectedAgent: AgentConfiguration | null
  onSelectAgent: (agent: AgentConfiguration) => void
  isLoadingAgents: boolean
  sessions: ChatSession[]
  currentSession: ChatSession | null
  onSelectSession: (session: ChatSession) => void
  onCreateSession: () => void
  isLoadingSessions: boolean
  className?: string
}

export function ChatSidebar({
  agents,
  selectedAgent,
  onSelectAgent,
  isLoadingAgents,
  sessions,
  currentSession,
  onSelectSession,
  onCreateSession,
  isLoadingSessions,
  className,
}: ChatSidebarProps) {
  return (
    <div className={cn('flex flex-col h-full bg-background border-r border-border w-80', className)}>
      {/* Agent Selector */}
      <div className="p-3 border-b border-border">
        <AgentSelector
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={onSelectAgent}
          isLoading={isLoadingAgents}
        />
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onCreateSession}
          className="w-full justify-start gap-2"
          variant="outline"
          disabled={!selectedAgent || isLoadingSessions}
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-auto px-2">
        {isLoadingSessions ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading chats...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-muted-foreground italic">No chats.</p>
          </div>
        ) : (
          <div className="space-y-1 pb-2">
            {sessions.map((session) => {
              const isActive = currentSession?.id === session.id

              return (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {session.title || 'Untitled Chat'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(session.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
