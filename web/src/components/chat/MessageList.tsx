/**
 * MessageList Component
 * Displays a scrollable list of chat messages with pagination and lazy loading
 * Optimized with React.memo for performance
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '@shared/types/chat'

interface MessageListProps {
  messages: ChatMessageType[]
  isLoading?: boolean
  className?: string
  onLoadMore?: () => Promise<void>
  hasMoreMessages?: boolean
  pageSize?: number
}

function MessageListComponent({
  messages,
  isLoading,
  className,
  onLoadMore,
  hasMoreMessages = false,
  pageSize = 50,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousScrollHeightRef = useRef(0)

  // Virtualization: Only render visible messages + buffer for large lists
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize })
  const shouldVirtualize = messages.length > 1000
  const ESTIMATED_MESSAGE_HEIGHT = 80 // Average height per message
  const BUFFER_SIZE = 10 // Number of messages to render outside viewport

  // Calculate visible range based on scroll position
  const updateVisibleRange = useCallback(() => {
    if (!shouldVirtualize || !containerRef.current) return

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const clientHeight = container.clientHeight

    // Calculate which messages are visible
    const startIndex = Math.max(0, Math.floor(scrollTop / ESTIMATED_MESSAGE_HEIGHT) - BUFFER_SIZE)
    const endIndex = Math.min(
      messages.length,
      Math.ceil((scrollTop + clientHeight) / ESTIMATED_MESSAGE_HEIGHT) + BUFFER_SIZE
    )

    setVisibleRange({ start: startIndex, end: endIndex })
  }, [shouldVirtualize, messages.length, ESTIMATED_MESSAGE_HEIGHT, BUFFER_SIZE])

  // Get messages to display (virtualized or all)
  const displayedMessages = shouldVirtualize
    ? messages.slice(visibleRange.start, visibleRange.end)
    : messages

  // Calculate offset for virtualization
  const topOffset = shouldVirtualize ? visibleRange.start * ESTIMATED_MESSAGE_HEIGHT : 0
  const bottomOffset = shouldVirtualize
    ? (messages.length - visibleRange.end) * ESTIMATED_MESSAGE_HEIGHT
    : 0

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const container = containerRef.current
    if (!container || !shouldAutoScroll) return

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, shouldAutoScroll])

  // Detect if user is near bottom to enable/disable auto-scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Enable auto-scroll if within 100px of bottom
    setShouldAutoScroll(distanceFromBottom < 100)

    // Update visible range for virtualization
    if (shouldVirtualize) {
      updateVisibleRange()
    }
  }, [shouldVirtualize, updateVisibleRange])

  // Initialize visible range on mount and when virtualization state changes
  useEffect(() => {
    if (shouldVirtualize) {
      updateVisibleRange()
    }
  }, [shouldVirtualize, updateVisibleRange])

  // Load more messages when scrolling to top
  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || !hasMoreMessages || isLoadingMore) return

    const container = containerRef.current
    if (!container) return

    // Store current scroll position
    previousScrollHeightRef.current = container.scrollHeight

    setIsLoadingMore(true)
    try {
      await onLoadMore()
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [onLoadMore, hasMoreMessages, isLoadingMore])

  // Restore scroll position after loading more messages
  useEffect(() => {
    const container = containerRef.current
    if (!container || !previousScrollHeightRef.current) return

    const newScrollHeight = container.scrollHeight
    const scrollDiff = newScrollHeight - previousScrollHeightRef.current

    if (scrollDiff > 0) {
      container.scrollTop += scrollDiff
      previousScrollHeightRef.current = 0
    }
  }, [displayedMessages.length])

  // Intersection Observer for lazy loading
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasMoreMessages) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.disconnect()
    }
  }, [hasMoreMessages, isLoadingMore, handleLoadMore])

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
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${className || ''}`}
    >
      {/* Load More Trigger (at top) */}
      {hasMoreMessages && (
        <div ref={loadMoreRef} className="flex justify-center py-2">
          {isLoadingMore ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              Loading older messages...
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {/* Virtualization info for debugging */}
      {shouldVirtualize && (
        <div className="text-xs text-muted-foreground text-center py-1 bg-muted/50 rounded">
          Showing {displayedMessages.length} of {messages.length} messages (virtualized)
        </div>
      )}

      {/* Top spacer for virtualization */}
      {shouldVirtualize && topOffset > 0 && (
        <div style={{ height: `${topOffset}px` }} aria-hidden="true" />
      )}

      {/* Message List */}
      {displayedMessages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Bottom spacer for virtualization */}
      {shouldVirtualize && bottomOffset > 0 && (
        <div style={{ height: `${bottomOffset}px` }} aria-hidden="true" />
      )}

      {/* Typing Indicator */}
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

      {/* Scroll Anchor */}
      <div ref={messagesEndRef} />

      {/* Scroll to Bottom Button (appears when not auto-scrolling) */}
      {!shouldAutoScroll && messages.length > 0 && (
        <button
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            setShouldAutoScroll(true)
          }}
          className="fixed bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all z-10"
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6 6-6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * Memoized MessageList component
 * Only re-renders when messages array changes or loading state changes
 */
export const MessageList = memo(MessageListComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.hasMoreMessages === nextProps.hasMoreMessages &&
    prevProps.className === nextProps.className &&
    // Deep comparison of last message to detect new messages
    (prevProps.messages.length === 0 ||
      prevProps.messages[prevProps.messages.length - 1]?.id ===
        nextProps.messages[nextProps.messages.length - 1]?.id)
  )
})
