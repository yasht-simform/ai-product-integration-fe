import type { ParsedStreamEvent } from '@/types/chat';

// Mirrors the backend's own frame shape (ai-chat/utils/sse-frame.util.ts): `event: <type>\ndata:
// <json>\n\n`. Kept a pure function for the same reason the backend keeps its formatter pure —
// easy to unit test independent of the fetch/ReadableStream transport.
export function parseSseFrame(frame: string): ParsedStreamEvent | null {
  let eventType = '';
  let dataLine = '';

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      eventType = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLine += line.slice('data:'.length).trim();
    }
  }

  if (!eventType || !dataLine) return null;

  try {
    return { type: eventType, data: JSON.parse(dataLine) } as ParsedStreamEvent;
  } catch {
    return null;
  }
}

// Splits a growing text buffer into complete `\n\n`-terminated SSE frames, returning the parsed
// events and whatever incomplete trailing text should be carried over to the next chunk.
export function extractSseFrames(buffer: string): { events: ParsedStreamEvent[]; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  const events = parts
    .map((frame) => parseSseFrame(frame))
    .filter((event): event is ParsedStreamEvent => event !== null);
  return { events, rest };
}
