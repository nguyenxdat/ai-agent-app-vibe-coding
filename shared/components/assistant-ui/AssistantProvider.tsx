/**
 * Assistant UI Provider
 * Wrapper for @assistant-ui/react components
 *
 * This provides a foundation for using assistant-ui components
 * for advanced chat UI features.
 */

import { ReactNode } from 'react'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { useChat } from '../../hooks/useChat'

interface AssistantProviderProps {
  sessionId: string
  children: ReactNode
}

/**
 * AssistantProvider
 *
 * Provides assistant-ui context for chat components.
 * Can be used to leverage assistant-ui's advanced features like:
 * - Thread management
 * - Message streaming
 * - Tool calling UI
 * - Adaptive cards
 */
export function AssistantProvider({ sessionId, children }: AssistantProviderProps) {
  const chat = useChat({ sessionId })

  // For now, we're using our custom useChat hook
  // In the future, this could be extended to use assistant-ui's runtime
  // with custom adapters for our WebSocket-based chat system

  return <div className="assistant-ui-wrapper">{children}</div>
}

/**
 * Example usage:
 *
 * ```tsx
 * import { AssistantProvider } from '@shared/components/assistant-ui/AssistantProvider'
 * import { Thread } from '@assistant-ui/react'
 *
 * function ChatPage() {
 *   return (
 *     <AssistantProvider sessionId="session-123">
 *       <Thread />
 *     </AssistantProvider>
 *   )
 * }
 * ```
 */
