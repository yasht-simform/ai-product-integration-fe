import { apiClient, unwrap } from '@/api/client';
import type {
  AskRequest,
  AskResponse,
  CreateDocumentTextRequest,
  Document,
  DocumentWithChunks,
  EvaluateRequest,
  EvaluationResult,
  GenerateDocumentsRequest,
  GenerateQaRequest,
  PaginatedChunksResponse,
  PaginatedDocumentsResponse,
  PaginatedQaPairsResponse,
  QaPair,
  QueryChunksParams,
  QueryDocumentsParams,
  QueryQaPairsParams,
  RagStats,
  SearchRequest,
  SearchResponse,
  SeedResult,
  UpdateDocumentRequest,
} from '@/types/rag';

// ── Documents ─────────────────────────────────────────────────────────────

export function uploadDocument(formData: FormData, onUploadProgress?: (percent: number) => void) {
  return unwrap<Document>(
    apiClient.post('/rag/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress
        ? (event) => onUploadProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0)
        : undefined,
    }),
  );
}

export function createDocumentFromText(payload: CreateDocumentTextRequest) {
  return unwrap<Document>(apiClient.post('/rag/documents/text', payload));
}

export function getDocuments(params: QueryDocumentsParams = {}) {
  return unwrap<PaginatedDocumentsResponse>(apiClient.get('/rag/documents', { params }));
}

export function getDocument(publicId: string) {
  return unwrap<DocumentWithChunks>(apiClient.get(`/rag/documents/${publicId}`));
}

export function getDocumentChunks(publicId: string, params: QueryChunksParams = {}) {
  return unwrap<PaginatedChunksResponse>(
    apiClient.get(`/rag/documents/${publicId}/chunks`, { params }),
  );
}

export function updateDocument(publicId: string, payload: UpdateDocumentRequest) {
  return unwrap<Document>(apiClient.patch(`/rag/documents/${publicId}`, payload));
}

export function deleteDocument(publicId: string) {
  return apiClient.delete(`/rag/documents/${publicId}`);
}

export function reindexDocument(publicId: string) {
  return unwrap<Document>(apiClient.post(`/rag/documents/${publicId}/reindex`));
}

// ── Search ────────────────────────────────────────────────────────────────

export function semanticSearch(payload: SearchRequest) {
  return unwrap<SearchResponse>(apiClient.post('/rag/search', payload));
}

// ── RAG Q&A ───────────────────────────────────────────────────────────────

export function askQuestion(payload: AskRequest) {
  return unwrap<AskResponse>(apiClient.post('/rag/ask', payload));
}

export function askInConversation(conversationId: string, payload: AskRequest) {
  return unwrap<AskResponse>(apiClient.post(`/rag/ask/conversation/${conversationId}`, payload));
}

// ── Mock data ─────────────────────────────────────────────────────────────

export function generateDocuments(payload: GenerateDocumentsRequest) {
  return unwrap<Document[]>(apiClient.post('/rag/mock/generate-documents', payload));
}

export function generateQAPairs(payload: GenerateQaRequest) {
  return unwrap<QaPair[]>(apiClient.post('/rag/mock/generate-qa', payload));
}

export function seedDefaultDataset() {
  return unwrap<SeedResult>(apiClient.post('/rag/mock/seed'));
}

export function seedRealisticDataset() {
  return unwrap<SeedResult>(apiClient.post('/rag/mock/seed-realistic'));
}

export function getQAPairs(params: QueryQaPairsParams = {}) {
  return unwrap<PaginatedQaPairsResponse>(apiClient.get('/rag/mock/qa-pairs', { params }));
}

// ── Evaluation ────────────────────────────────────────────────────────────

export function runEvaluation(payload: EvaluateRequest = {}) {
  return unwrap<EvaluationResult>(apiClient.post('/rag/evaluate', payload));
}

// ── Stats ─────────────────────────────────────────────────────────────────

export function getRagStats() {
  return unwrap<RagStats>(apiClient.get('/rag/stats'));
}
