/**
 * MessageInput Component
 * Input field for sending chat messages
 */

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const MAX_MESSAGE_LENGTH = 10000

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Type a message...',
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = message.trim()

    // Validation
    if (!trimmed) return

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long. Maximum ${MAX_MESSAGE_LENGTH.toLocaleString()} characters allowed.`)
      return
    }

    if (!disabled) {
      onSend(trimmed)
      setMessage('')
      setError(null)
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Enforce hard limit (prevent typing beyond max)
    if (newValue.length > MAX_MESSAGE_LENGTH) {
      setError(`Maximum ${MAX_MESSAGE_LENGTH.toLocaleString()} characters reached`)
      return
    }

    setMessage(newValue)
    setError(null)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const charCount = message.length
  const isNearLimit = charCount > MAX_MESSAGE_LENGTH * 0.9
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH

  return (
    <div className={`border-t p-4 ${className || ''}`}>
      {error && (
        <div className="mb-2 p-2 bg-destructive/10 text-destructive text-sm rounded">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`min-h-[60px] max-h-[200px] resize-none ${isOverLimit ? 'border-destructive' : ''}`}
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim() || isOverLimit}
          size="icon"
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
        <p className={`text-xs ${isNearLimit ? 'text-warning' : 'text-muted-foreground'} ${isOverLimit ? 'text-destructive font-medium' : ''}`}>
          {charCount.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
