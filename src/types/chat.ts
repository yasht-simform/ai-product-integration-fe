// Mirrors ai-product-integration-be: src/modules/ai-chat/constants/*.enum.ts and dto/*.ts
import type { Usage } from '@/types/openai';

export const ChatMessageRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const;
export type ChatMessageRole = (typeof ChatMessageRole)[keyof typeof ChatMessageRole];

export const ToolHandlerType = {
  BUILTIN: 'builtin',
  HTTP: 'http',
} as const;
export type ToolHandlerType = (typeof ToolHandlerType)[keyof typeof ToolHandlerType];

// ── Conversations ─────────────────────────────────────────────────────────

export interface Conversation {
  publicId: string;
  title?: string;
  systemPrompt?: string;
  model: string;
  toolsEnabled: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  title?: string;
  systemPrompt?: string;
  model?: string;
  toolsEnabled?: boolean;
}

// toolsEnabled is fixed at creation time — dropped from the update surface (backend
// UpdateConversationDto omits it entirely).
export type UpdateConversationRequest = Partial<
  Pick<CreateConversationRequest, 'title' | 'systemPrompt' | 'model'>
>;

export interface QueryConversationsParams {
  userId?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}

// ── Messages ──────────────────────────────────────────────────────────────

// MessageResDto.toolCalls is `unknown` on the backend (an opaque JSON blob) because two
// different call sites write two different shapes into the same column:
//  - the non-streaming two-call protocol stores the raw OpenAI SDK shape
//  - the SSE streaming path stores its own flatter ToolCallData shape
// Both are normalized client-side via `normalizeToolCalls()` (pages/chat/utils.ts).
export interface OpenAiFunctionToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface StreamToolCallData {
  toolCallId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export type RawToolCall = OpenAiFunctionToolCall | StreamToolCallData;

export interface NormalizedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// role: 'tool' ChatMessage.content is JSON.stringify()'d from exactly this shape
// (ToolExecutorService.execute()'s return value — see ai-chat/services/tool-executor.service.ts).
export interface ToolExecutionResult {
  success: boolean;
  result: unknown;
  error?: string;
  executionMs: number;
}

export interface ChatMessage {
  publicId: string;
  role: ChatMessageRole | string;
  content?: string;
  toolCalls?: RawToolCall[] | null;
  toolCallId?: string;
  toolName?: string;
  tokenCount?: number;
  cost?: number;
  latencyMs?: number;
  model?: string;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  content: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AssistantMessage {
  messageId: string;
  role: string;
  content?: string;
  model: string;
  toolCalls?: RawToolCall[] | null;
  usage: Usage;
  estimatedCost: number;
  latencyMs: number;
}

// ── Tools ─────────────────────────────────────────────────────────────────

export interface Tool {
  publicId: string;
  name: string;
  displayName: string;
  description: string;
  parameters: Record<string, unknown>;
  handlerType: ToolHandlerType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateToolRequest {
  name: string;
  displayName: string;
  description: string;
  parameters: Record<string, unknown>;
  handlerType: ToolHandlerType;
  handlerConfig?: Record<string, unknown>;
}

export type UpdateToolRequest = Partial<CreateToolRequest>;

// ── SSE streaming ─────────────────────────────────────────────────────────
// Backend emits `data:` as JSON.stringify(payload) — for `token` events that payload is a plain
// string, not `{ content: string }`. See ai-chat/services/streaming.service.ts.

export interface StreamDoneData {
  messageId: string;
  usage: Usage;
  estimatedCost: number;
  latencyMs: number;
}

export type ParsedStreamEvent =
  | { type: 'token'; data: string }
  | { type: 'tool_call'; data: StreamToolCallData }
  | { type: 'tool_result'; data: { toolCallId: string; result: unknown } }
  | { type: 'done'; data: StreamDoneData }
  | { type: 'error'; data: { error: string } };
