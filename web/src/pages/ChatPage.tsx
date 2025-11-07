/**
 * ChatPage Component
 * Main chat interface page
 */

import { useState, useEffect } from 'react'
import { MainLayout, Header } from '../components/layouts/MainLayout'
import { NavigationMenu } from '../components/layouts/NavigationMenu'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ChatContainer } from '../components/chat/ChatContainer'
import { SettingsContent } from '../components/settings/SettingsContent'
import { ChevronDown } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { agentApi } from '../services/agentApi'
import { sessionApi } from '../services/sessionApi'
import type { AgentConfiguration } from '@shared/types/agent'
import type { ChatSession } from '@shared/types/chat'

export function ChatPage() {
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(
    null
  )
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<string>('chat')
  const [settingsTab, setSettingsTab] = useState<'agents' | 'general' | 'appearance'>('agents')

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

  const isInSettings = currentView.startsWith('settings-')

  return (
    <MainLayout
      leftNav={
        <NavigationMenu
          currentPage={currentView}
          onNavigate={(page) => {
            if (page === 'chat') {
              setCurrentView('chat')
            } else if (page === 'settings-agents') {
              setCurrentView('settings-agents')
              setSettingsTab('agents')
            } else if (page === 'settings-general') {
              setCurrentView('settings-general')
              setSettingsTab('general')
            } else if (page === 'settings-appearance') {
              setCurrentView('settings-appearance')
              setSettingsTab('appearance')
            }
          }}
        />
      }
      middlePanel={
        !isInSettings ? (
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
        ) : undefined
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
      {/* Main Content Area */}
      {isInSettings ? (
        <div className="flex h-full">
          {/* Settings Content - Full Width */}
          {settingsTab === 'agents' && (
            <SettingsContent onAgentsChange={loadAgents} />
          )}
          {settingsTab === 'general' && (
            <div className="flex-1 p-6">
              <h2 className="text-2xl font-semibold mb-4">General Settings</h2>
              <p className="text-muted-foreground">General settings coming soon...</p>
            </div>
          )}
          {settingsTab === 'appearance' && (
            <div className="flex-1 p-6">
              <h2 className="text-2xl font-semibold mb-4">Appearance Settings</h2>
              <p className="text-muted-foreground">Appearance settings coming soon...</p>
            </div>
          )}
        </div>
      ) : !currentSession ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💬</span>
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
        <ChatContainer
          agent={selectedAgent}
          chat={chat}
          error={error}
          onClearError={() => setError(null)}
        />
      )}
    </MainLayout>
  )
}
