# Frontend Phase 3 — Prompts Reference

> Prompt to give to Claude Code for the FE project after Phase 3 BE is complete.
> Status: Ready to execute once BE Phase 3 is done.

---

## Prompt: Knowledge Base, RAG Q&A, Document Management, Evaluation

```
Working in the ai-product-integration-fe project. Phase 3 backend (RAG) is complete — document upload, embedding pipeline, Pinecone vector search, RAG Q&A with citations, mock data generation, and evaluation. Backend at http://localhost:3000/api/v1.

## New Backend Endpoints

### Documents
- POST /api/v1/rag/documents — upload file (multipart form: file, title?, description?, category?, tags?)
- POST /api/v1/rag/documents/text — create from raw text { title, content, description?, category?, tags? }
- GET /api/v1/rag/documents — list (paginated, filterable: category, embeddingStatus, search, page, limit)
- GET /api/v1/rag/documents/:publicId — get document with chunk count and status
- GET /api/v1/rag/documents/:publicId/chunks — get chunks (paginated)
- PATCH /api/v1/rag/documents/:publicId — update metadata
- DELETE /api/v1/rag/documents/:publicId — delete (cascades to chunks + Pinecone vectors)
- POST /api/v1/rag/documents/:publicId/reindex — re-chunk and re-embed

### Search
- POST /api/v1/rag/search — { query, topK?, similarityThreshold?, category?, documentIds? }

### Q&A (RAG)
- POST /api/v1/rag/ask — { question, topK?, model?, temperature?, category?, includeSourceChunks? }
- POST /api/v1/rag/ask/conversation/:publicId — RAG within existing conversation

### Mock Data
- POST /api/v1/rag/mock/generate-documents — { count, categories?, minWords?, maxWords? }
- POST /api/v1/rag/mock/generate-qa — { count, documentIds? }
- POST /api/v1/rag/mock/seed — seed default dataset (50 docs + 500 Q&A)
- POST /api/v1/rag/mock/seed-realistic — seed realistic CloudPulse documents with real Q&A pairs
- GET /api/v1/rag/mock/qa-pairs — list Q&A pairs

### Evaluation
- POST /api/v1/rag/evaluate — run Q&A pairs through RAG, score accuracy

### Stats
- GET /api/v1/rag/stats — total docs, chunks, vectors, cache hit rate, embedding model

## Pages to Build

### 1. Knowledge Base (/knowledge-base)

The main RAG page — document management + Q&A interface.

**Top Stats Row:**
- Stat cards: Total Documents, Total Chunks, Vectors in Pinecone, Cache Hit Rate
- Data from GET /rag/stats

**Two-Tab Layout:**

**Tab 1: Documents**
- Document table: title, category badge, source type (PDF/TXT/MD/Generated), chunks count, tokens count, embedding status (pending/processing/completed/failed with colored badges), upload date
- Upload button → dialog with file picker (PDF, TXT, MD) + metadata fields (title, description, category dropdown, tags)
- "Add from Text" button → dialog with title + text area for pasting content
- Each document row expandable to show chunks preview
- Actions per document: view chunks, reindex, delete
- Filter by: category, embedding status, search by title
- Pagination

**Tab 2: Q&A (RAG)**
- Split layout: left = question input, right = answer with sources
- Question input: text area + model selector + temperature slider + category filter + topK slider (1-10)
- "Ask" button sends POST /rag/ask
- Answer display:
  - The generated answer text
  - "Sources" section below: collapsible cards for each source chunk showing document title, chunk text (truncated), similarity score as a percentage bar, chunk index
  - Metrics row: tokens used, cost, total latency, search latency, generation latency
- Previous Q&A history in the session (client-side, not persisted)
- "Ask in Conversation" button that creates a new chat conversation with RAG context

### 2. Mock Data & Evaluation (/knowledge-base/evaluation)

Sub-page or tab within Knowledge Base:

**Generate Section:**
- "Generate Documents" button with count input (default: 10) + category multi-select
- "Generate Q&A Pairs" button with count input
- "Seed Default Dataset" button (50 docs + 500 Q&A)
- "Seed Realistic Dataset" button (CloudPulse docs with real Q&A pairs)
- Progress indicator during generation

**Q&A Pairs Table:**
- Columns: question (truncated), expected answer (truncated), source document, complexity tier badge (simple=green, multi-step=amber, edge-case=red)
- Pagination
- Filter by complexity tier

**Evaluation Section:**
- "Run Evaluation" button → calls POST /rag/evaluate
- Results display:
  - Overall accuracy bar (e.g. 72%)
  - Breakdown by complexity: simple (87%), multi-step (60%), edge-case (33%)
  - Stats: total questions, correct, partially correct, incorrect, "I don't know" responses
  - Average latency and tokens per question
- Results displayed as a dashboard with cards and a bar chart (recharts)

### 3. Update Sidebar Navigation

Add:
- Knowledge Base (icon: BookText or Library) → /knowledge-base
Place after Tools in navigation order.

### 4. Update Dashboard

Add to the Dashboard page:
- New stat card: "Knowledge Base" showing document count and vector count from /rag/stats
- Or a small section: "RAG Pipeline: X documents, Y chunks, Z vectors"

### 5. API Client Updates

Add to src/api/:
```typescript
// Documents
uploadDocument(formData: FormData): Promise<Document>
createDocumentFromText(data: CreateDocumentTextDto): Promise<Document>
getDocuments(params?: { category?, embeddingStatus?, search?, page?, limit? }): Promise<PaginatedResponse<Document>>
getDocument(publicId: string): Promise<DocumentWithDetails>
getDocumentChunks(publicId: string, params?: { page?, limit? }): Promise<PaginatedResponse<Chunk>>
updateDocument(publicId: string, data: UpdateDocumentDto): Promise<Document>
deleteDocument(publicId: string): Promise<void>
reindexDocument(publicId: string): Promise<void>

// Search
semanticSearch(data: SearchDto): Promise<SearchResponse>

// RAG Q&A
askQuestion(data: AskDto): Promise<RagResult>
askInConversation(conversationId: string, data: AskDto): Promise<RagResult>

// Mock Data
generateDocuments(data: GenerateDocsDto): Promise<Document[]>
generateQAPairs(data: GenerateQADto): Promise<QAPair[]>
seedDefaultDataset(): Promise<SeedResult>
seedRealisticDataset(): Promise<SeedResult>
getQAPairs(params?: { complexity?, page?, limit? }): Promise<PaginatedResponse<QAPair>>

// Evaluation
runEvaluation(): Promise<EvaluationResult>

// Stats
getRagStats(): Promise<RagStats>
```

### 6. TypeScript Types

```typescript
interface Document {
  publicId: string;
  title: string;
  description: string | null;
  sourceType: 'pdf' | 'txt' | 'md' | 'generated';
  originalFilename: string | null;
  fileSize: number | null;
  totalChunks: number;
  totalTokens: number;
  embeddingModel: string;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  category: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Chunk {
  publicId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
  embeddingStatus: string;
  createdAt: string;
}

interface SearchResult {
  chunkPublicId: string;
  documentPublicId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  score: number;
  category: string | null;
}

interface RagResult {
  answer: string;
  model: string;
  sources: RagSource[];
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  estimatedCost: number;
  latencyMs: number;
  chunksRetrieved: number;
  searchLatencyMs: number;
  generationLatencyMs: number;
}

interface RagSource {
  documentTitle: string;
  documentPublicId: string;
  chunkContent: string;
  chunkIndex: number;
  similarityScore: number;
}

interface QAPair {
  question: string;
  expectedAnswer: string;
  sourceDocumentId: string;
  complexity: 'simple' | 'multi-step' | 'edge-case';
}

interface EvaluationResult {
  totalQuestions: number;
  correct: number;
  partiallyCorrect: number;
  incorrect: number;
  appropriateIDK: number;
  accuracy: number;
  avgLatencyMs: number;
  avgTokens: number;
  byComplexity: Record<string, { total: number; correct: number; accuracy: number }>;
}

interface RagStats {
  totalDocuments: number;
  totalChunks: number;
  totalVectors: number;
  cacheHitRate: number;
  embeddingModel: string;
  indexDimensions: number;
}
```

## Design Guidelines
- Knowledge Base page should feel like a document management system + Q&A interface
- Source citations in RAG answers should be visually prominent — collapsible cards with similarity score bars
- Similarity scores displayed as percentage (0.92 → "92% match") with colored bars (green > 80%, amber > 60%, red < 60%)
- Embedding status badges: pending=gray, processing=blue+spinner, completed=green, failed=red
- Complexity tier badges: simple=green, multi-step=amber, edge-case=red
- File upload should show progress and handle large files gracefully
- Evaluation results should be a mini-dashboard with recharts bar chart for complexity breakdown
- Follow existing shadcn/Tailwind patterns from Phase 1 and Phase 2 FE
- Toast notifications for: upload complete, ingestion started, evaluation done, deletion
- Loading skeletons while fetching
```

---

## Prompt: Update Glossary for Phase 3 (run after FE Phase 3 is built)

```
Update the Glossary page (/glossary) to reflect Phase 3 completion:

1. In Section 1 (Concepts), change these from "Planned" to "Implemented":
   - Vector Embeddings → "Implemented" — EmbeddingService.generateEmbedding(), Pinecone storage
   - Semantic Search → "Implemented" — SearchService.search(), cosine similarity in Pinecone
   - RAG (Retrieval-Augmented Generation) → "Implemented" — RagService.query(), /rag/ask endpoint with citations

2. In Section 2 (Tools), update:
   - LangChain → "Phase 3 ✅" — used for PDFLoader, TextLoader, RecursiveCharacterTextSplitter
   - Pinecone → "Phase 3 ✅" — vector storage for document embeddings, cosine similarity search
   - @faker-js/faker → "Phase 3 ✅" — mock document and Q&A pair generation

3. In Section 3 (Key Practices), update:
   - Cache Embeddings → "Implemented" — EmbeddingCacheService with SHA-256 hash dedup

4. In Section 4 (Practice Apps), update:
   - App 1: Knowledge Base Q&A → "✅ Implemented" — /knowledge-base page with document upload, RAG Q&A, evaluation

5. Update the progress bar count at the top of the page.
```
