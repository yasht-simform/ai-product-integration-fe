import { ChatMessageRole, type ChatMessage, type NormalizedToolCall, type RawToolCall, type ToolExecutionResult } from '@/types/chat';
import type { DisplayMessage, ToolCallDisplay } from '@/pages/chat/types';

function parseArguments(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

// MessageResDto.toolCalls is an opaque JSON blob on the backend — the non-streaming two-call
// protocol stores the raw OpenAI SDK shape ({id, type: 'function', function: {name, arguments}}),
// while the SSE streaming path stores its own flatter shape ({toolCallId, toolName, arguments}).
// Both are normalized here so the UI only ever deals with one shape.
export function normalizeToolCalls(raw: RawToolCall[] | null | undefined): NormalizedToolCall[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((call): NormalizedToolCall | null => {
      if ('function' in call && call.function) {
        return { id: call.id, name: call.function.name, arguments: parseArguments(call.function.arguments) };
      }
      if ('toolCallId' in call) {
        return { id: call.toolCallId, name: call.toolName, arguments: parseArguments(call.arguments) };
      }
      return null;
    })
    .filter((call): call is NormalizedToolCall => call !== null);
}

export function conversationTitle(title: string | undefined | null): string {
  return title && title.trim() ? title : 'New Chat';
}

function parseToolResult(content: string | undefined): ToolExecutionResult | undefined {
  if (!content) return undefined;
  try {
    return JSON.parse(content) as ToolExecutionResult;
  } catch {
    return undefined;
  }
}

// Folds the DB's separate assistant(toolCalls) + tool(result)-per-call rows (AI-027's two-call
// protocol) into single display bubbles, and drops system/tool rows from the flat message list —
// tool rows are attached to their owning assistant bubble instead of rendered standalone.
export function buildDisplayMessages(messages: ChatMessage[]): DisplayMessage[] {
  const display: DisplayMessage[] = [];

  for (const message of messages) {
    if (message.role === ChatMessageRole.SYSTEM || message.role === ChatMessageRole.TOOL) continue;

    if (message.role === ChatMessageRole.USER) {
      display.push({ id: message.publicId, role: 'user', content: message.content });
      continue;
    }

    const normalized = normalizeToolCalls(message.toolCalls);
    const toolCalls: ToolCallDisplay[] | undefined =
      normalized.length > 0
        ? normalized.map((call) => ({
            ...call,
            result: parseToolResult(
              messages.find((m) => m.role === ChatMessageRole.TOOL && m.toolCallId === call.id)?.content,
            ),
          }))
        : undefined;

    display.push({
      id: message.publicId,
      role: 'assistant',
      content: message.content,
      toolCalls,
      model: message.model,
      tokenCount: message.tokenCount,
      estimatedCost: message.cost,
      latencyMs: message.latencyMs,
    });
  }

  return display;
}
