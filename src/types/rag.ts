// Mirrors ai-product-integration-be: src/modules/rag/{constants,dto,types}/*
import type { Usage } from '@/types/openai';

export const DocumentSourceType = {
  PDF: 'pdf',
  TXT: 'txt',
  MD: 'md',
  GENERATED: 'generated',
} as const;
export type DocumentSourceType = (typeof DocumentSourceType)[keyof typeof DocumentSourceType];

export const EmbeddingStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type EmbeddingStatus = (typeof EmbeddingStatus)[keyof typeof EmbeddingStatus];

export const DocumentCategory = {
  GUIDE: 'guide',
  FAQ: 'faq',
  DOCS: 'docs',
  TUTORIAL: 'tutorial',
  CHANGELOG: 'changelog',
} as const;
export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  [DocumentCategory.GUIDE]: 'Guide',
  [DocumentCategory.FAQ]: 'FAQ',
  [DocumentCategory.DOCS]: 'Docs',
  [DocumentCategory.TUTORIAL]: 'Tutorial',
  [DocumentCategory.CHANGELOG]: 'Changelog',
};

export const QaComplexity = {
  SIMPLE: 'simple',
  MULTI_STEP: 'multi-step',
  EDGE_CASE: 'edge-case',
} as const;
export type QaComplexity = (typeof QaComplexity)[keyof typeof QaComplexity];

export const QA_COMPLEXITY_LABELS: Record<QaComplexity, string> = {
  [QaComplexity.SIMPLE]: 'Simple',
  [QaComplexity.MULTI_STEP]: 'Multi-Step',
  [QaComplexity.EDGE_CASE]: 'Edge Case',
};

// ── Documents ─────────────────────────────────────────────────────────────

export interface Document {
  publicId: string;
  title: string;
  description?: string;
  sourceType: DocumentSourceType | string;
  originalFilename?: string;
  fileSize?: number;
  totalChunks: number;
  totalTokens: number;
  embeddingModel: string;
  embeddingStatus: EmbeddingStatus | string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  publicId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
  embeddingStatus: string;
  createdAt: string;
}

export interface DocumentWithChunks extends Document {
  chunks: DocumentChunk[];
}

export interface CreateDocumentTextRequest {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
  content: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
}

export interface QueryDocumentsParams {
  category?: DocumentCategory;
  status?: EmbeddingStatus;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QueryChunksParams {
  page?: number;
  limit?: number;
}

export interface PaginatedDocumentsResponse {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedChunksResponse {
  data: DocumentChunk[];
  total: number;
  page: number;
  limit: number;
}

// ── Search ────────────────────────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  topK?: number;
  similarityThreshold?: number;
  category?: DocumentCategory;
  documentIds?: string[];
}

export interface SearchResultItem {
  chunkPublicId: string;
  documentPublicId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  score: number;
  category?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalResults: number;
  searchLatencyMs: number;
}

// ── Q&A (RAG) ─────────────────────────────────────────────────────────────

export interface AskRequest {
  question: string;
  topK?: number;
  model?: string;
  temperature?: number;
  category?: DocumentCategory;
  includeSourceChunks?: boolean;
}

export interface RagSource {
  documentTitle: string;
  documentPublicId: string;
  chunkContent: string;
  chunkIndex: number;
  similarityScore: number;
}

export interface AskResponse {
  answer: string;
  model: string;
  sources: RagSource[];
  usage: Usage;
  estimatedCost: number;
  latencyMs: number;
  chunksRetrieved: number;
  searchLatencyMs: number;
  generationLatencyMs: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────

export interface GenerateDocumentsRequest {
  count: number;
  categories?: DocumentCategory[];
  minWords?: number;
  maxWords?: number;
}

export interface GenerateQaRequest {
  count: number;
  documentIds?: string[];
}

export interface QaPair {
  publicId: string;
  question: string;
  expectedAnswer: string;
  sourceDocumentId: string;
  complexity: QaComplexity | string;
  createdAt: string;
}

export interface QueryQaPairsParams {
  documentId?: string;
  complexity?: QaComplexity;
  page?: number;
  limit?: number;
}

export interface PaginatedQaPairsResponse {
  data: QaPair[];
  total: number;
  page: number;
  limit: number;
}

export interface SeedResult {
  documents: number;
  qaPairs: number;
}

// ── Evaluation ────────────────────────────────────────────────────────────

export interface EvaluateQaPairInput {
  question: string;
  expectedAnswer: string;
  complexity: string;
}

export interface EvaluateRequest {
  sampleSize?: number;
  qaPairs?: EvaluateQaPairInput[];
}

export interface EvaluationComplexityBreakdown {
  total: number;
  correct: number;
  accuracy: number;
}

export interface EvaluationResult {
  totalQuestions: number;
  correct: number;
  partiallyCorrect: number;
  incorrect: number;
  appropriateIDK: number;
  accuracy: number;
  avgLatencyMs: number;
  avgTokens: number;
  byComplexity: Record<string, EvaluationComplexityBreakdown>;
}

// ── Stats ─────────────────────────────────────────────────────────────────

export interface RagStats {
  totalDocuments: number;
  totalChunks: number;
  totalVectors: number;
  cacheHitRate: number;
  embeddingModel: string;
  indexDimensions?: number;
}
