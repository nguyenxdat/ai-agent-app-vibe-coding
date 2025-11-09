# Assistant UI Components

This directory contains wrapper components for [@assistant-ui/react](https://www.assistant-ui.com/).

## What is Assistant UI?

Assistant UI is a set of React components designed for building AI chat interfaces with advanced features like:

- **Thread Management**: Multi-turn conversations
- **Streaming Messages**: Real-time message streaming
- **Tool Calling**: Visual UI for AI tool/function calls
- **Adaptive Cards**: Rich, interactive message cards
- **Attachments**: File uploads and media
- **Branching**: Alternative conversation paths

## Installation

```bash
npm install @assistant-ui/react
```

Already installed in this project ✅

## Current Usage

Currently, we're using our **custom chat implementation** with:
- `useChat` hook for WebSocket-based chat
- Custom `ChatMessage`, `MessageList`, `ChatContainer` components
- Markdown and code block rendering

## Future Integration

Assistant UI can be integrated to provide:

1. **Enhanced Thread UI**: Replace custom MessageList with `<Thread />` component
2. **Better Streaming**: Use assistant-ui's streaming capabilities
3. **Tool Calling UI**: Visual representation of AI function calls
4. **Branching Conversations**: Allow users to explore different conversation paths

## Example Integration

```tsx
import { AssistantProvider } from '@shared/components/assistant-ui/AssistantProvider'
import { Thread, Composer } from '@assistant-ui/react'

function ChatPage() {
  return (
    <AssistantProvider sessionId="session-123">
      <div className="h-full flex flex-col">
        <Thread />
        <Composer />
      </div>
    </AssistantProvider>
  )
}
```

## Custom Adapter (Future)

To integrate with our WebSocket backend:

```tsx
import { useLocalRuntime } from '@assistant-ui/react'

function createWebSocketAdapter(sessionId: string) {
  return {
    async *streamText({ messages }) {
      // Connect to WebSocket
      const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`)

      // Send message
      ws.send(JSON.stringify(messages[messages.length - 1]))

      // Stream response
      for await (const chunk of wsStream(ws)) {
        yield chunk
      }
    }
  }
}
```

## Documentation

- [Assistant UI Docs](https://www.assistant-ui.com/docs)
- [GitHub](https://github.com/Yonom/assistant-ui)
- [Examples](https://www.assistant-ui.com/examples)

## Status

- ✅ **Installed**: @assistant-ui/react package installed
- ✅ **Provider Created**: Basic AssistantProvider wrapper
- ⏳ **Not Yet Used**: Still using custom implementation
- 🔮 **Future**: Can be integrated for advanced features

## Why Not Using Yet?

Our current custom implementation:
- Works well with existing WebSocket architecture
- Provides full control over message flow
- Supports our specific A2A protocol requirements
- Has custom markdown and code rendering

Assistant UI can be adopted incrementally when we need:
- More complex UI patterns
- Branching conversations
- Tool calling visualization
- Advanced streaming features
