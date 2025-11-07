/**
 * ChatContainer Component
 * Contains the active chat session UI with messages and input
 */

import { Button } from '../ui/button'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import type { AgentConfiguration } from '@shared/types/agent'

interface ChatHookResult {
  messages: any[]
  isConnected: boolean
  isLoading: boolean
  isSending: boolean
  isTyping: boolean
  sendMessage: (content: string) => void
  reconnect: () => void
  clearError: () => void
}

interface ChatContainerProps {
  agent: AgentConfiguration | null
  chat: ChatHookResult
  error: string | null
  onClearError: () => void
}

export function ChatContainer({
  agent,
  chat,
  error,
  onClearError,
}: ChatContainerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClearError()
              chat.clearError()
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

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
          <MessageList messages={chat.messages} isLoading={chat.isLoading} />
        </div>
      </div>

      {/* Typing Indicator */}
      {chat.isTyping && (
        <div className="max-w-3xl mx-auto px-4 pb-2 w-full">
          <TypingIndicator agentName={agent?.name} />
        </div>
      )}

      {/* Message Input - Centered */}
      <div className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <MessageInput
            onSend={chat.sendMessage}
            disabled={chat.isSending || !chat.isConnected}
            placeholder={
              chat.isConnected ? 'Send a message...' : 'Connecting to chat...'
            }
          />
        </div>
      </div>
    </div>
  )
}
