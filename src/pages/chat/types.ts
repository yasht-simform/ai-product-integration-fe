import type { ToolExecutionResult } from '@/types/chat';

export interface ToolCallDisplay {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: ToolExecutionResult;
}

// Flattened view of a persisted assistant/user message (or an in-flight streaming placeholder)
// for rendering — folds the DB's separate assistant(toolCalls)/tool(result) rows into one bubble.
export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  isStreaming?: boolean;
  isError?: boolean;
  toolCalls?: ToolCallDisplay[];
  model?: string;
  tokenCount?: number;
  estimatedCost?: number;
  latencyMs?: number;
}
