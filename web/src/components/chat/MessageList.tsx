/**
 * MessageList Component
 * Displays a scrollable list of chat messages
 */

import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '@shared/types/chat'

interface MessageListProps {
  messages: ChatMessageType[]
  isLoading?: boolean
  className?: string
}

export function MessageList({ messages, isLoading, className }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm mt-1">Start a conversation by sending a message</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${className || ''}`}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-4 py-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
