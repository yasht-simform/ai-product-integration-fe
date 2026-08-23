# Frontend Phase 2 — Prompts Reference

> Prompt given to Claude Code for the FE project during Phase 2.
> Stored for reference — this has already been executed.

---

## Prompt: Chat UI, Streaming, Conversation Management, Tools Page

```
Working in the ai-product-integration-fe project. Phase 2 backend is complete — multi-turn chat with persistent conversations, SSE streaming, and function calling with 3 built-in tools. The backend is at http://localhost:3000/api/v1.

## New Backend Endpoints

### Conversations
- POST /api/v1/chat/conversations — create { title?, systemPrompt?, model?, toolsEnabled? }
- GET /api/v1/chat/conversations — list (paginated, query: page, limit)
- GET /api/v1/chat/conversations/:publicId — get conversation with all messages
- PATCH /api/v1/chat/conversations/:publicId — update { title?, systemPrompt?, model? }
- DELETE /api/v1/chat/conversations/:publicId — delete (cascade deletes messages)
- POST /api/v1/chat/conversations/:publicId/archive — archive conversation

### Messages
- POST /api/v1/chat/conversations/:publicId/messages — send message (sync) { content, model?, temperature?, maxTokens? }
- POST /api/v1/chat/conversations/:publicId/messages/stream — send message (SSE streaming) { content, model?, temperature?, maxTokens? }

### SSE Event Format (from /messages/stream)
The streaming endpoint returns Server-Sent Events:
- event: token → data: { "content": "word" }           — individual token chunk
- event: tool_call → data: { "toolCallId": "...", "toolName": "calculator", "arguments": {...} }
- event: tool_result → data: { "toolCallId": "...", "result": 132678 }
- event: done → data: { "messageId": "...", "usage": { "inputTokens": 145, "outputTokens": 28, "totalTokens": 173 }, "estimatedCost": 0, "latencyMs": 2300 }
- event: error → data: { "error": "..." }

### Tools
- GET /api/v1/chat/tools — list all registered tools
- POST /api/v1/chat/tools — register tool { name, displayName, description, parameters (JSON Schema), handlerType, handlerConfig? }
- PATCH /api/v1/chat/tools/:publicId — update tool
- DELETE /api/v1/chat/tools/:publicId — deactivate tool

### Response Shapes
Conversation: { publicId, title, systemPrompt, model, userId, toolsEnabled, isArchived, metadata, createdAt, updatedAt }
Message: { publicId, role ("user"|"assistant"|"system"|"tool"), content, toolCalls, toolCallId, toolName, tokenCount, cost, latencyMs, model, createdAt }
Tool: { publicId, name, displayName, description, parameters, handlerType, handlerConfig, isActive, createdAt, updatedAt }

## What to Build

### 1. Replace the Current Chat Playground (/chat) with a Full Chat Interface

The current chat page is a simple single-shot prompt. Replace it entirely with a proper chat application:

**Left Sidebar — Conversation List:**
- List all conversations (GET /conversations), most recent first
- Each item shows: title (or "New Chat"), model badge, message count, last updated time
- "New Chat" button at top creates a new conversation
- Click a conversation to load it
- Right-click or kebab menu: rename, archive, delete
- Search/filter conversations
- Archived conversations hidden by default, toggle to show

**Center — Chat Area:**
- Message bubbles: user messages on right (blue), assistant messages on left (gray)
- For assistant messages show: model badge, token count, cost, latency at bottom of bubble
- Tool call messages rendered as collapsible cards: "🔧 Calculator called" → expand to see input/output
- Tool result messages rendered inline before the final assistant response
- Typing indicator while waiting for response
- Auto-scroll to bottom on new messages
- Empty state for new conversations: "Start a conversation" with suggested prompts

**Bottom — Input Bar:**
- Text area (auto-grow, shift+enter for newline, enter to send)
- Send button
- Streaming toggle (switch between sync and streaming mode)
- When streaming: tokens appear word-by-word in real time as SSE events arrive
- Disable input while waiting for response

**Right Panel or Top Bar — Conversation Settings:**
- Model selector (reuse the shared ModelSelector component from Phase 1 FE)
- System prompt text area (editable per conversation)
- Temperature slider
- Max tokens input
- Tools toggle (enable/disable function calling)
- When tools enabled, show active tools list with toggle per tool

### 2. SSE Streaming Implementation

This is critical — use the EventSource API or fetch with ReadableStream:

```typescript
// Use fetch for SSE (EventSource doesn't support POST)
const response = await fetch(`${API_BASE}/chat/conversations/${id}/messages/stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  // Parse SSE events: split by \n\n, extract event type and data
  // For "token" events: append content to the current message bubble
  // For "tool_call" events: show tool invocation card
  // For "tool_result" events: show tool result
  // For "done" event: finalize message with usage stats
  // For "error" event: show error toast
}
```

The streaming should feel real-time — tokens appear as they arrive, not buffered.

### 3. Tool Management Page (/tools)

A page to view and manage registered tools:

**Tool Cards Grid:**
- Each tool as a card: icon, name, description, handler type badge (builtin/http), active toggle
- The 3 built-in tools (calculator, weather, datetime) shown with a "Built-in" badge — can be toggled but not deleted
- "Register New Tool" button → dialog with form for HTTP tools

**Register Tool Dialog:**
- Name (slug format)
- Display Name
- Description
- Handler Type: builtin (disabled for new) or HTTP
- For HTTP: URL, method, headers
- Parameters: JSON Schema editor (use a textarea with JSON validation)
- Preview: show how the tool definition will look to the model

### 4. Update Sidebar Navigation

Add/update items:
- Chat (icon: MessageSquare) → /chat — replace the old chat playground
- Tools (icon: Wrench) → /tools

Remove or update the old "Chat Playground" link if it exists — /chat is now the full chat interface.

### 5. API Client Updates

Add to src/api/:

```typescript
// Conversations
createConversation(data: CreateConversationDto): Promise<Conversation>
getConversations(params?: { page?, limit? }): Promise<PaginatedResponse<Conversation>>
getConversation(publicId: string): Promise<ConversationWithMessages>
updateConversation(publicId: string, data: UpdateConversationDto): Promise<Conversation>
deleteConversation(publicId: string): Promise<void>
archiveConversation(publicId: string): Promise<void>

// Messages
sendMessage(conversationId: string, data: SendMessageDto): Promise<AssistantMessage>
sendMessageStream(conversationId: string, data: SendMessageDto): ReadableStream // SSE

// Tools
getTools(): Promise<Tool[]>
createTool(data: CreateToolDto): Promise<Tool>
updateTool(publicId: string, data: UpdateToolDto): Promise<Tool>
deleteTool(publicId: string): Promise<void>
```

### 6. TypeScript Types

Add types matching backend:
```typescript
interface Conversation {
  publicId: string;
  title: string | null;
  systemPrompt: string | null;
  model: string;
  toolsEnabled: boolean;
  isArchived: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  publicId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  toolCalls: ToolCall[] | null;
  toolCallId: string | null;
  toolName: string | null;
  tokenCount: number | null;
  cost: number | null;
  latencyMs: number | null;
  model: string | null;
  createdAt: string;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

interface Tool {
  publicId: string;
  name: string;
  displayName: string;
  description: string;
  parameters: Record<string, unknown>;
  handlerType: 'builtin' | 'http';
  handlerConfig: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StreamEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
  data: unknown;
}
```

### 7. Custom Hook for SSE Streaming

Create a reusable hook: src/hooks/useStreamingChat.ts

```typescript
function useStreamingChat() {
  // State: messages, isStreaming, currentStreamingContent, error
  // Methods: sendMessage(conversationId, content) → handles SSE parsing
  // Appends tokens to currentStreamingContent in real time
  // On done: finalizes the message with usage stats
  // On error: shows toast and stops streaming
  // On tool_call/tool_result: updates UI with tool invocation cards
  // Returns: { messages, isStreaming, currentStreamingContent, sendMessage, error }
}
```

## Design Guidelines
- Chat interface should feel like ChatGPT/Claude — clean, fast, responsive
- Message bubbles: rounded corners, subtle shadows, user = blue-ish, assistant = gray/white
- Streaming text should animate smoothly — no flickering or layout jumps
- Tool calls should be visually distinct: collapsible card with tool icon, name, and expand to see details
- Dark mode support (use existing shadcn theme)
- Mobile responsive but desktop-first
- Use existing shadcn components: Card, Button, Input, Textarea, ScrollArea, Badge, Dialog, DropdownMenu, Switch, Separator, Skeleton
- Toast notifications for errors, conversation deleted, tool registered, etc.

## Important
- The SSE streaming is the hero feature — it MUST work smoothly with real-time token display
- Test against the running backend — real conversations, real streaming, real tool calls
- The old single-shot chat page is fully replaced by the new conversation-based chat
- Conversation state should persist in React state and survive page navigation (use context or state management)
- Handle loading states, empty states, and error states for every component
```
