/**
 * ChatPage Component
 * Main chat interface page
 */

import { useState, useEffect } from 'react'
import {
  MainLayout,
  Header,
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from '../components/layouts/MainLayout'
import { Button } from '../components/ui/button'
import { MessageList } from '../components/chat/MessageList'
import { MessageInput } from '../components/chat/MessageInput'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { useChat } from '../hooks/useChat'
import { agentApi } from '../services/agentApi'
import { sessionApi } from '../services/sessionApi'
import type { AgentConfiguration } from '@shared/types/agent'
import type { ChatSession } from '@shared/types/chat'

interface ChatPageProps {
  onBack?: () => void
}

export function ChatPage({ onBack }: ChatPageProps) {
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(
    null
  )
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load active agents
  useEffect(() => {
    loadAgents()
  }, [])

  // Load sessions when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      loadSessions(selectedAgent.id)
    }
  }, [selectedAgent])

  const loadAgents = async () => {
    try {
      setIsLoadingAgents(true)
      const data = await agentApi.getAllAgents()
      const activeAgents = data.filter((a) => a.isActive)
      setAgents(activeAgents)

      // Auto-select first agent
      if (activeAgents.length > 0 && !selectedAgent) {
        const firstAgent = activeAgents[0]
        if (firstAgent) {
          setSelectedAgent(firstAgent)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setIsLoadingAgents(false)
    }
  }

  const loadSessions = async (agentId: string) => {
    try {
      setIsLoadingSessions(true)
      const data = await sessionApi.getSessions({ agent_id: agentId })
      setSessions(data)

      // Auto-select most recent session or create new one
      if (data.length > 0 && !currentSession) {
        const firstSession = data[0]
        if (firstSession) {
          setCurrentSession(firstSession)
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load sessions'
      )
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleCreateSession = async () => {
    if (!selectedAgent) return

    try {
      const session = await sessionApi.createSession({
        agent_id: selectedAgent.id,
        user_id: 'default-user', // TODO: Get from auth context
        title: `Chat with ${selectedAgent.name}`,
      })

      setSessions((prev) => [session, ...prev])
      setCurrentSession(session)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create session'
      )
    }
  }

  const handleSelectAgent = (agent: AgentConfiguration) => {
    setSelectedAgent(agent)
    setCurrentSession(null)
    setSessions([])
  }

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session)
  }

  // Chat hook (only active when session is selected)
  // We conditionally use the hook to avoid connecting with empty sessionId
  const chat = useChat({
    sessionId: currentSession?.id || 'placeholder',
    onError: (err) => setError(err.message),
  })

  return (
    <MainLayout
      header={
        <Header
          title={
            currentSession
              ? currentSession.title || 'Chat'
              : 'Select a chat'
          }
          actions={
            <>
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
            </>
          }
        />
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold">Chats</h2>
          </SidebarHeader>
          <SidebarContent>
            {/* Agent Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Select Agent
              </label>
              {isLoadingAgents ? (
                <p className="text-sm text-muted-foreground">
                  Loading agents...
                </p>
              ) : agents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active agents available
                </p>
              ) : (
                <select
                  className="w-full p-2 rounded border bg-background"
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    const agent = agents.find((a) => a.id === e.target.value)
                    if (agent) handleSelectAgent(agent)
                  }}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* New Chat Button */}
            {selectedAgent && (
              <Button
                onClick={handleCreateSession}
                className="w-full mb-4"
                disabled={!selectedAgent}
              >
                New Chat
              </Button>
            )}

            {/* Sessions List */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recent Chats</label>
              {isLoadingSessions ? (
                <p className="text-sm text-muted-foreground">
                  Loading sessions...
                </p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No chat sessions yet
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`w-full text-left p-2 rounded hover:bg-accent ${
                      currentSession?.id === session.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="text-sm font-medium truncate">
                      {session.title || 'Untitled'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </SidebarContent>
        </Sidebar>
      }
    >
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null)
              chat.clearError()
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Chat Interface */}
      {!currentSession ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No chat selected</p>
            <p className="text-sm mt-1">
              {selectedAgent
                ? 'Click "New Chat" to start a conversation'
                : 'Please select an agent first'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Connection Status */}
          {!chat.isConnected && !chat.isLoading && (
            <div className="bg-warning/10 text-warning px-4 py-2 text-sm flex items-center justify-between">
              <span>Disconnected from chat server</span>
              <Button variant="ghost" size="sm" onClick={chat.reconnect}>
                Reconnect
              </Button>
            </div>
          )}

          {/* Messages */}
          <MessageList
            messages={chat.messages}
            isLoading={chat.isLoading}
            className="flex-1"
          />

          {/* Typing Indicator */}
          {chat.isTyping && (
            <div className="px-4 pb-2">
              <TypingIndicator agentName={selectedAgent?.name} />
            </div>
          )}

          {/* Message Input */}
          <MessageInput
            onSend={chat.sendMessage}
            disabled={chat.isSending || !chat.isConnected}
            placeholder={
              chat.isConnected
                ? 'Type a message...'
                : 'Connecting to chat...'
            }
          />
        </div>
      )}
    </MainLayout>
  )
}
