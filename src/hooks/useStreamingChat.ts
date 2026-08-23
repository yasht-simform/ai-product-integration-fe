import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getMessageStreamUrl } from '@/api/chat';
import { extractSseFrames } from '@/lib/sse';
import type { SendMessageRequest, StreamDoneData, StreamToolCallData } from '@/types/chat';

interface StreamingState {
  isStreaming: boolean;
  streamingContent: string;
  streamingToolCalls: StreamToolCallData[];
  error: string | null;
}

const INITIAL_STATE: StreamingState = {
  isStreaming: false,
  streamingContent: '',
  streamingToolCalls: [],
  error: null,
};

interface SendMessageHandlers {
  onDone?: (data: StreamDoneData) => void;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: { message?: string | string[] } = await response.json();
    if (body.message) return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  } catch {
    // response body wasn't JSON — fall through to the generic message below
  }
  return `Request failed (${response.status})`;
}

// SSE streaming can't use the shared axios instance (no ReadableStream support in this project's
// interceptor-based client), so this hook talks to the stream endpoint directly via fetch().
export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (conversationId: string, payload: SendMessageRequest, handlers: SendMessageHandlers = {}) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ isStreaming: true, streamingContent: '', streamingToolCalls: [], error: null });

      try {
        const response = await fetch(getMessageStreamUrl(conversationId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(await readErrorMessage(response));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = extractSseFrames(buffer);
          buffer = rest;

          for (const event of events) {
            if (event.type === 'token') {
              setState((s) => ({ ...s, streamingContent: s.streamingContent + event.data }));
            } else if (event.type === 'tool_call') {
              setState((s) => ({ ...s, streamingToolCalls: [...s.streamingToolCalls, event.data] }));
            } else if (event.type === 'done') {
              handlers.onDone?.(event.data);
            } else if (event.type === 'error') {
              setState((s) => ({ ...s, error: event.data.error }));
              toast.error(event.data.error);
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const message = error instanceof Error ? error.message : 'Streaming failed';
        setState((s) => ({ ...s, error: message }));
        toast.error(message);
      } finally {
        setState((s) => ({ ...s, isStreaming: false }));
        abortRef.current = null;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, sendMessage, cancel, reset };
}
