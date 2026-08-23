import { apiClient, unwrap } from '@/api/client';
import type {
  AssistantMessage,
  Conversation,
  ConversationWithMessages,
  CreateConversationRequest,
  CreateToolRequest,
  PaginatedConversationsResponse,
  QueryConversationsParams,
  SendMessageRequest,
  Tool,
  UpdateConversationRequest,
  UpdateToolRequest,
} from '@/types/chat';

// ── Conversations ─────────────────────────────────────────────────────────

export function createConversation(payload: CreateConversationRequest) {
  return unwrap<Conversation>(apiClient.post('/chat/conversations', payload));
}

export function getConversations(params: QueryConversationsParams = {}) {
  return unwrap<PaginatedConversationsResponse>(apiClient.get('/chat/conversations', { params }));
}

export function getConversation(publicId: string) {
  return unwrap<ConversationWithMessages>(apiClient.get(`/chat/conversations/${publicId}`));
}

export function updateConversation(publicId: string, payload: UpdateConversationRequest) {
  return unwrap<Conversation>(apiClient.patch(`/chat/conversations/${publicId}`, payload));
}

export function deleteConversation(publicId: string) {
  return apiClient.delete(`/chat/conversations/${publicId}`);
}

export function archiveConversation(publicId: string) {
  return apiClient.post(`/chat/conversations/${publicId}/archive`);
}

// ── Messages ──────────────────────────────────────────────────────────────

export function sendMessage(publicId: string, payload: SendMessageRequest) {
  return unwrap<AssistantMessage>(apiClient.post(`/chat/conversations/${publicId}/messages`, payload));
}

// Streaming can't go through the axios instance (no ReadableStream support) — the
// useStreamingChat hook calls this endpoint directly via fetch().
export function getMessageStreamUrl(publicId: string): string {
  return `${apiClient.defaults.baseURL}/chat/conversations/${publicId}/messages/stream`;
}

// ── Tools ─────────────────────────────────────────────────────────────────

export function getTools() {
  return unwrap<Tool[]>(apiClient.get('/chat/tools'));
}

export function createTool(payload: CreateToolRequest) {
  return unwrap<Tool>(apiClient.post('/chat/tools', payload));
}

export function updateTool(publicId: string, payload: UpdateToolRequest) {
  return unwrap<Tool>(apiClient.patch(`/chat/tools/${publicId}`, payload));
}

export function deleteTool(publicId: string) {
  return apiClient.delete(`/chat/tools/${publicId}`);
}
