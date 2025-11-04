/**
 * ChatMessage Component
 * Displays a single chat message
 */

import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@shared/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUser && 'bg-primary text-primary-foreground',
          message.role === 'agent' && 'bg-muted',
          isSystem && 'bg-secondary text-secondary-foreground text-sm'
        )}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        {/* Error indicator */}
        {message.status === 'error' && message.error && (
          <div className="text-destructive text-xs mt-1">
            Error: {message.error}
          </div>
        )}

        {/* Pending indicator */}
        {message.status === 'pending' && (
          <div className="text-xs mt-1 opacity-70">Sending...</div>
        )}
      </div>
    </div>
  )
}
