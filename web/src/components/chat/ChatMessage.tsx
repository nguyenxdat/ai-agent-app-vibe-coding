/**
 * ChatMessage Component
 * Displays a single chat message with rich format support
 */

import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@shared/types/chat'
import { MarkdownMessage } from './MarkdownMessage'
import { CodeBlock } from './CodeBlock'

interface ChatMessageProps {
  message: ChatMessageType
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const format = message.format || 'plain'

  // Render content based on format
  const renderContent = () => {
    switch (format) {
      case 'markdown':
        return <MarkdownMessage content={message.content} />

      case 'code': {
        // Extract language from metadata if available
        const language = message.metadata?.language || 'text'
        return <CodeBlock code={message.content} language={language} />
      }

      case 'plain':
      default:
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )
    }
  }

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
          'rounded-lg',
          // Only add padding for plain/markdown, CodeBlock has its own styling
          format !== 'code' && 'px-4 py-2',
          // Max width except for code blocks which need more space
          format === 'code' ? 'max-w-[85%]' : 'max-w-[70%]',
          isUser && format !== 'code' && 'bg-primary text-primary-foreground',
          message.role === 'agent' && format !== 'code' && 'bg-muted',
          isSystem && 'bg-secondary text-secondary-foreground text-sm'
        )}
      >
        {/* Message content with format-specific rendering */}
        {renderContent()}

        {/* Timestamp - only show for non-code format (code block has its own header) */}
        {format !== 'code' && (
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
        )}

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
