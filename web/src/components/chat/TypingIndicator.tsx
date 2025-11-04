/**
 * TypingIndicator Component
 * Shows when agent is typing
 */

interface TypingIndicatorProps {
  agentName?: string
  className?: string
}

export function TypingIndicator({ agentName, className }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 text-muted-foreground text-sm ${className || ''}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
      <span>{agentName || 'Agent'} is typing...</span>
    </div>
  )
}
