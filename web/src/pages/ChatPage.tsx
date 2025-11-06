/**
 * ChatPage Component
 * Main chat interface page
 */

import { useState, useEffect } from 'react'
import { MainLayout, Header } from '../components/layouts/MainLayout'
import { NavigationMenu } from '../components/layouts/NavigationMenu'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { SettingsContent } from '../components/settings/SettingsContent'
import { SettingsSidebar } from '../components/settings/SettingsSidebar'
import { Button } from '../components/ui/button'
import { MessageList } from '../components/chat/MessageList'
import { MessageInput } from '../components/chat/MessageInput'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { ChevronDown } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { agentApi } from '../services/agentApi'
import { sessionApi } from '../services/sessionApi'
import type { AgentConfiguration } from '@shared/types/agent'
import type { ChatSession } from '@shared/types/chat'

interface ChatPageProps {
  onBack?: () => void
  onSettings?: () => void
}

export function ChatPage({ onSettings }: ChatPageProps) {
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(
    null
  )
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat')

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
      leftNav={
        <NavigationMenu
          currentPage={currentView}
          onNavigate={(page) => {
            if (page === 'chat') {
              setCurrentView('chat')
            } else if (page === 'settings') {
              setCurrentView('settings')
            }
          }}
        />
      }
      middlePanel={
        currentView === 'settings' ? (
          <SettingsSidebar />
        ) : (
          <ChatSidebar
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={handleSelectAgent}
            isLoadingAgents={isLoadingAgents}
            sessions={sessions}
            currentSession={currentSession}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            isLoadingSessions={isLoadingSessions}
          />
        )
      }
      header={
        <Header
          title=""
          actions={
            <>
              {/* Quick Settings Dropdown */}
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                <span className="text-sm font-medium">Quick Settings</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Model Selector */}
              {selectedAgent && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                  <span className="text-sm font-medium">{selectedAgent.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </>
          }
        />
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

      {/* Main Content Area */}
      {currentView === 'settings' ? (
        <SettingsContent onAgentsChange={loadAgents} />
      ) : !currentSession ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">UI</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Chatbot UI</h2>
            <p className="text-muted-foreground">
              {selectedAgent
                ? 'Start a new conversation by clicking "+ New Chat"'
                : 'Select a workspace to begin'}
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

          {/* Messages Container - Centered */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto px-4">
              <MessageList
                messages={chat.messages}
                isLoading={chat.isLoading}
              />
            </div>
          </div>

          {/* Typing Indicator */}
          {chat.isTyping && (
            <div className="max-w-3xl mx-auto px-4 pb-2 w-full">
              <TypingIndicator agentName={selectedAgent?.name} />
            </div>
          )}

          {/* Message Input - Centered */}
          <div className="border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <MessageInput
                onSend={chat.sendMessage}
                disabled={chat.isSending || !chat.isConnected}
                placeholder={
                  chat.isConnected
                    ? 'Send a message...'
                    : 'Connecting to chat...'
                }
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
