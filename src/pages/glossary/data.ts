import type {
  ApiParameterEntry,
  ConceptEntry,
  PracticeAppEntry,
  PracticeEntry,
  ResponseFieldEntry,
  ToolEntry,
} from '@/pages/glossary/types';

export const CONCEPTS: ConceptEntry[] = [
  {
    term: 'Chat Completions',
    plainEnglish: 'Sending a message to an AI and getting a response back.',
    technical:
      'A single request/response API call where you send a list of messages (system/user/assistant roles) to an LLM and receive a generated assistant message, optionally with usage and cost metadata.',
    whyItMatters:
      "It's the fundamental building block of any LLM-powered feature — every chatbot, summarizer, or classifier starts with a completion call.",
    implementation:
      'OpenaiService.chatCompletion() (single prompt) and chatCompletionWithMessages() (multi-turn) share a private executeCompletion() tail. Exposed via POST /openai/chat.',
    status: 'implemented',
  },
  {
    term: 'Streaming Responses',
    plainEnglish:
      "Getting the AI's answer word-by-word in real time instead of waiting for the whole thing.",
    technical:
      'Instead of waiting for the full completion, the API returns Server-Sent Events (SSE) chunks as tokens are generated, each carrying a small delta of the response.',
    whyItMatters:
      'Improves perceived latency — users see the answer forming immediately instead of staring at a spinner for the entire generation time.',
    implementation:
      'StreamingService.streamCompletion() is an async generator over OPENAI_CLIENT with stream: true. ChatController exposes POST /chat/conversations/:publicId/messages/stream via raw @Res() (bypassing the global ResponseInterceptor), building frames with formatSseFrame().',
    status: 'implemented',
  },
  {
    term: 'Function Calling (Tool Use)',
    plainEnglish: 'The AI can use tools like a calculator or weather API to answer questions accurately.',
    technical:
      'The model is given a JSON Schema list of available functions. Instead of answering directly it can request a function call, then use the returned result to produce a final answer — a two-call protocol.',
    whyItMatters:
      "LLMs can't do arithmetic reliably, don't know today's date, and have no live data access — tools let them delegate those tasks to deterministic code.",
    implementation:
      'ToolRegistryService defines 3 built-in tools (calculator, weather, datetime); ToolExecutorService dispatches and sandboxes execution; ChatService.handleToolCalls() implements the two-call protocol.',
    status: 'implemented',
  },
  {
    term: 'Token Counting',
    plainEnglish:
      'Measuring the "word-pieces" that AI models charge by — like weighing a package before shipping.',
    technical:
      "Tokens are the sub-word units LLMs actually process (not characters or words). Every model has a tokenizer (BPE-based) that splits text into these units, and providers bill per token.",
    whyItMatters:
      "You can't estimate cost or fit text into a context window without counting tokens accurately.",
    implementation:
      "TokenService.countTokens() uses tiktoken's WASM encoder, caching one Tiktoken instance per model — encoding_for_model() takes ~110–145ms to reload uncached, so a per-model cache is required for buildContext() to stay fast.",
    status: 'implemented',
  },
  {
    term: 'Prompt Engineering',
    plainEnglish: 'Writing instructions (prompts) that make the AI behave consistently and correctly.',
    technical:
      "The practice of designing a prompt's wording, structure, and examples to reliably steer a model's output format, tone, and correctness — without changing model weights.",
    whyItMatters:
      'The same model can produce wildly different quality results depending on how a request is phrased — this is the cheapest lever for improving output quality.',
    implementation:
      '6 seed prompt templates (prisma/seed.ts) plus PromptTemplateService (CRUD, variable rendering) let templates be authored and reused instead of hardcoded inline.',
    status: 'implemented',
  },
  {
    term: 'System Prompts',
    plainEnglish:
      "Hidden instructions that set the AI's personality, rules, and boundaries for a conversation.",
    technical:
      "A message with role: 'system' placed first in the message array. It isn't shown to the end user but instructs the model on persona, constraints, and behavioral rules for the whole conversation.",
    whyItMatters:
      "Without a system prompt, every conversation starts from the model's generic default behavior — no guardrails, no consistent persona.",
    implementation:
      'systemPrompt is a field on both ChatConversation and PromptTemplate. ChatService.buildContext() always synthesizes it as the first message and never counts it as a stored ChatMessage row.',
    status: 'implemented',
  },
  {
    term: 'Few-Shot Examples',
    plainEnglish: 'Teaching the AI by showing it examples of correct input/output pairs.',
    technical:
      "Example input/output pairs embedded in the prompt before the real question, so the model pattern-matches the desired format from demonstration rather than instruction alone.",
    whyItMatters:
      'Some formats (exact JSON shapes, specific tones) are easier to show than to describe in words — few-shot examples reduce ambiguity.',
    implementation:
      'fewShotExamples field (FewShotExampleDto[]) on CreatePromptTemplateDto / the PromptTemplate model, rendered by PromptTemplateService.',
    status: 'implemented',
  },
  {
    term: 'Temperature',
    plainEnglish:
      "A knob that controls how creative vs predictable the AI's responses are (0 = robotic, 1 = creative).",
    technical:
      'A sampling parameter that scales the probability distribution over next-token choices. Low temperature makes the model greedily pick the most likely token; high temperature flattens the distribution for more varied output.',
    whyItMatters:
      'Different tasks need different tradeoffs — a support bot answering FAQs wants determinism (low), a brainstorming tool wants variety (high).',
    implementation:
      'An optional field on ChatCompletionDto, SendMessageDto, and ModelCompareDto, spread conditionally into every OpenAI SDK call (never a hardcoded default).',
    status: 'implemented',
  },
  {
    term: 'Rate Limiting',
    plainEnglish: "When the AI provider says \"slow down, you're sending too many requests.\"",
    technical:
      'Providers cap how many requests/tokens per minute an API key can use; exceeding it returns HTTP 429, sometimes with a Retry-After header.',
    whyItMatters:
      "Protects the provider's infrastructure, but from the client side it means your app must expect and gracefully handle 429s instead of just failing.",
    implementation:
      'RetryService.executeWithRetry() classifies 429 (and 500/503) as ApiErrorType.RETRYABLE and retries with backoff instead of surfacing an error immediately.',
    status: 'implemented',
  },
  {
    term: 'Exponential Backoff',
    plainEnglish:
      "Waiting longer each time you retry — 1s, 2s, 4s, 8s — so you don't overwhelm a struggling service.",
    technical:
      'A retry strategy where the wait time between attempts doubles each time, usually with random jitter added to avoid synchronized retry storms across clients.',
    whyItMatters:
      'Retrying immediately after a failure just hits the same overloaded/broken service again — backing off gives it room to recover.',
    implementation:
      'RetryService.executeWithRetry(), configured via the RETRY_CONFIG constant (base delay, max retries, jitter factor) plus openai.* config overrides.',
    status: 'implemented',
  },
  {
    term: 'Circuit Breaker',
    plainEnglish:
      'An automatic safety switch that stops calling a broken service, waits, then cautiously tries again.',
    technical:
      "A three-state machine (CLOSED → OPEN → HALF_OPEN) tracking consecutive failures. Past a threshold it 'opens' and short-circuits every call immediately for a cooldown period, then allows one trial call (HALF_OPEN) before fully closing again.",
    whyItMatters:
      'Without it, a downstream outage makes every request hang through a full retry cycle, wasting time on calls that are certain to fail.',
    implementation:
      'RetryService tracks circuit state internally (getCircuitState(), resetCircuit()); CircuitOpenException (HTTP 503) is thrown immediately when OPEN, mapped via ApiErrorType.CIRCUIT_OPEN.',
    status: 'implemented',
  },
  {
    term: 'Context Window',
    plainEnglish:
      "The maximum amount of text an AI model can \"see\" at once — like the model's short-term memory limit.",
    technical:
      'The maximum combined number of tokens (input + output) a model can process in a single request. Exceeding it is a hard error, not a warning.',
    whyItMatters:
      "Long conversations eventually don't fit — the app has to decide what to trim before hitting that wall.",
    implementation:
      'ChatService.buildContext() implements a sliding window: fetches the last chatConfig.maxContextMessages messages, trims from the oldest until the running token count fits contextWindow * contextWindowPercentage, and truncates a single oversized message by ratio as a last resort.',
    status: 'implemented',
  },
  {
    term: 'Vector Embeddings',
    plainEnglish:
      'Converting text into numbers (vectors) so a computer can measure how similar two pieces of text are.',
    technical:
      'A model converts text into a fixed-length array of floating-point numbers such that semantically similar texts produce numerically close vectors (measured via cosine similarity).',
    whyItMatters:
      "Enables \"search by meaning\" instead of exact keyword matching — the foundation of semantic search and RAG.",
    implementation:
      'EmbeddingService.generateEmbedding() (OpenaiService.generateEmbedding() under the hood) converts each document chunk to a vector, stored in Pinecone alongside chunk metadata (documentId, chunkIndex, category).',
    status: 'implemented',
  },
  {
    term: 'Semantic Search',
    plainEnglish: 'Finding documents by meaning, not just matching keywords — "car" finds "automobile".',
    technical:
      'Embed a query into the same vector space as a document corpus, then retrieve the documents whose embeddings are closest by a similarity metric, rather than matching literal words.',
    whyItMatters:
      'Keyword search misses synonyms and paraphrases; semantic search finds relevant results even when no words overlap.',
    implementation:
      'SearchService.search() embeds the query, runs cosine similarity search in Pinecone (topK + similarityThreshold), then resolves matches back to full chunk text/document metadata via Postgres. Exposed via POST /rag/search.',
    status: 'implemented',
  },
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    plainEnglish:
      'Instead of the AI guessing, first find relevant documents, then give them to the AI to answer from.',
    technical:
      "A pipeline: embed and index a document corpus → at query time, retrieve the top-K most relevant chunks via semantic search → inject those chunks into the LLM's prompt as context → the LLM answers grounded in that retrieved text.",
    whyItMatters:
      "Lets an LLM answer accurately about private or current data it was never trained on, and reduces hallucination since it must ground answers in supplied text.",
    implementation:
      'RagService.query() combines SearchService.search() retrieval with OpenaiService.chatCompletionWithMessages() generation, returning an answer with citations built directly from the retrieved chunks (never parsed from model output). Exposed via POST /rag/ask, with citations shown in the Knowledge Base Q&A UI.',
    status: 'implemented',
  },
  {
    term: 'Content Filtering',
    plainEnglish:
      'Automatically detecting and blocking harmful, inappropriate, or policy-violating content.',
    technical:
      "Passing user input or model output through a moderation classifier (e.g. OpenAI's moderations endpoint) that scores it against categories like hate, violence, or sexual content, blocking or flagging anything above a threshold.",
    whyItMatters:
      'LLM apps are exposed to arbitrary user input and can generate harmful output — moderation is a required safety layer before shipping to real users.',
    implementation:
      "Phase 4 ✅ — ModerationService (threshold classification + moderation_logs) with ModerationGuard blocking flagged input (422) and OutputModerationInterceptor replacing flagged output, backed by OpenAI's moderation API (FREE). Exposed via POST /moderation/check and the Moderation page.",
    status: 'implemented',
  },
  {
    term: 'Per-User Cost Budgets',
    plainEnglish:
      'Spending caps per user — once someone hits their daily or monthly dollar limit, their AI calls are blocked until the period resets.',
    technical:
      'Daily/monthly USD limits stored per user, enforced at request time by aggregating that user’s actual spend from the audit log. Exceeding a limit returns HTTP 429; crossing an alert threshold (default 80%) surfaces a warning instead of blocking.',
    whyItMatters:
      'One runaway user, loop, or bug can burn an entire AI budget in hours — hard per-user limits turn a silent cost spiral into a visible 429.',
    implementation:
      'Phase 4 ✅ — CostBudgetService (CRUD + cached spend aggregation over ai_audit_logs) and CostBudgetGuard on every chat/RAG route: 429 when exceeded, X-Budget-Warning header near the limit. Managed via /cost/budgets and the Cost Management page.',
    status: 'implemented',
  },
  {
    term: 'Cost Analytics',
    plainEnglish:
      'Charts and breakdowns showing where AI spend actually goes — by user, by model, by feature, and over time.',
    technical:
      'Read-only aggregates over the audit log: groupBy user/model/endpoint, a day-bucketed spend timeline (SQL date_trunc), and a month-to-date ÷ days-elapsed × days-in-month projection of monthly spend.',
    whyItMatters:
      '"We spent $X" is useless on its own — controlling spend requires knowing which user, model, and feature drove it, and where the month is heading.',
    implementation:
      'Phase 4 ✅ — CostAnalyticsService: per-user/model/feature breakdowns, daily spend timeline, and projected monthly spend. Exposed via GET /cost/analytics/* and visualized on the Cost Management page.',
    status: 'implemented',
  },
  {
    term: 'Data Retention',
    plainEnglish:
      'Automatically deleting old data — logs and stale records are cleaned up after a configurable number of days instead of piling up forever.',
    technical:
      'Time-based cleanup: rows older than a per-category retention period (audit logs, moderation logs, archived conversations, embedding cache) are deleted in bounded batches on a cron schedule. Active conversations are never eligible, by construction.',
    whyItMatters:
      'Log tables grow without bound, and keeping user content forever is a compliance liability — retention keeps storage and risk proportional to what the app actually needs.',
    implementation:
      "Phase 4 ✅ — RetentionService: automated cron cleanup (RETENTION_CRON, default 2 AM daily) with batched deletes and runtime-configurable retention periods; manual trigger via POST /retention/cleanup and the Data Retention page.",
    status: 'implemented',
  },
  {
    term: 'Audit Logging',
    plainEnglish: 'Recording every AI interaction — who asked what, which model, how much it cost, did it work.',
    technical:
      'Every AI API call is persisted as a row recording the model used, status (success/failed/retried), token usage, cost, and latency — independent of application logs.',
    whyItMatters:
      "Without it you can't answer \"who called what, when, and how much did it cost\" after the fact — critical for debugging, billing, and compliance.",
    implementation:
      'AiAuditService.log() is a fire-and-forget write to ai_audit_logs; findAll() (paginated+filtered) and getCostSummary() (aggregated) back GET /openai/audit-logs and /openai/audit-logs/cost-summary.',
    status: 'implemented',
  },
  {
    term: 'Cost Tracking',
    plainEnglish: "Monitoring how much money each AI call costs so spending doesn't spiral out of control.",
    technical:
      "Multiplying per-model input/output token counts by that model's published per-1M-token price to estimate the dollar cost of a call, aggregated over time, model, or user.",
    whyItMatters:
      'LLM costs scale directly with usage and vary 100x+ between models — without tracking, spend can spiral silently.',
    implementation:
      'TokenService.calculateCost() (async) resolves price via ModelRegistryService (DB, 5-minute cache) → falls back to the hardcoded MODEL_PRICING constant → falls back to 0.',
    status: 'implemented',
  },
  {
    term: 'Model Selection',
    plainEnglish: 'Choosing the right AI model for the job — cheap & fast vs expensive & smart.',
    technical:
      "Models trade off capability, latency, and price. Picking the cheapest/fastest model that still clears a task's quality bar avoids wasting money on unnecessary capability.",
    whyItMatters:
      'Using a frontier paid model for every trivial request (e.g. a datetime lookup) wastes money for no quality benefit.',
    implementation:
      "ModelRegistryService + OpenRouterSyncService maintain a live registry of 340+ models across 56 providers, synced daily via @Cron('0 3 * * *'). openai.defaultModel falls back to a free OpenRouter model, never a hardcoded paid one.",
    status: 'implemented',
  },
];

export const TOOLS: ToolEntry[] = [
  {
    name: 'OpenAI API',
    whatItIs: 'The AI service that powers GPT models.',
    whatItDoes:
      "Provides HTTP endpoints for chat completions, embeddings, moderation, and more, backed by OpenAI's GPT model family. Handles inference at scale so you never run a model yourself.",
    whyUseIt:
      'Use it when you need the highest-quality general-purpose models and are comfortable paying per token.',
    howWeUseIt: 'Core LLM provider, wrapped entirely by OpenaiService — no controller calls the SDK directly.',
    pricing: 'paid',
    status: 'implemented',
    phaseLabel: 'Phase 1',
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    name: 'Azure OpenAI Service',
    whatItIs: "Microsoft's hosted version of OpenAI models.",
    whatItDoes:
      'Serves the same GPT models as OpenAI directly, but through Azure infrastructure with enterprise SLAs, regional deployment, and Azure AD-based auth and billing.',
    whyUseIt:
      'Use it when an organization requires data residency, enterprise compliance, or is already standardized on Azure billing/IAM.',
    howWeUseIt: 'Not integrated yet — would be a baseURL swap on the existing OPENAI_CLIENT factory, no service changes needed.',
    pricing: 'paid',
    status: 'not-started',
    phaseLabel: 'Planned',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/',
  },
  {
    name: 'OpenRouter',
    whatItIs: 'A gateway that routes to 400+ AI models from different providers through one API.',
    whatItDoes:
      "Exposes a single OpenAI-compatible API surface in front of dozens of upstream providers (Meta, Google, Mistral, and more), including a large catalog of free-tier models.",
    whyUseIt: 'Use it to experiment across many models without integrating each provider separately, or to access free models for development.',
    howWeUseIt:
      'Primary provider for free models — OPENAI_BASE_URL points at OpenRouter, and OpenRouterSyncService auto-syncs its full model catalog into ai_providers/ai_models daily.',
    pricing: 'freemium',
    status: 'implemented',
    phaseLabel: 'Phase 1',
    docsUrl: 'https://openrouter.ai/docs',
  },
  {
    name: 'LangChain',
    whatItIs: 'A framework for building LLM-powered apps — chains, agents, retrievers, document loaders.',
    whatItDoes:
      'Provides composable building blocks (document loaders, text splitters, vector store wrappers, retrieval chains, agents) so you don’t hand-roll RAG or agent orchestration from scratch.',
    whyUseIt: 'Use it when you need to assemble a multi-step LLM pipeline (load → chunk → embed → retrieve → generate) quickly.',
    howWeUseIt:
      'Used for PDFLoader/TextLoader-style document parsing and RecursiveCharacterTextSplitter for token-aware chunking in DocumentService (@langchain/textsplitters, @langchain/core).',
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 3 ✅',
    docsUrl: 'https://js.langchain.com/docs/',
  },
  {
    name: 'LlamaIndex',
    whatItIs: 'A data framework for connecting LLMs to your data — indexing, querying, retrieval.',
    whatItDoes:
      'Focuses specifically on data ingestion and indexing for LLM retrieval, with a simpler mental model than LangChain for pure RAG use cases.',
    whyUseIt: 'Use it as a lighter-weight alternative to LangChain when the task is purely "index my data and query it."',
    howWeUseIt: 'Documented as a comparison alternative to LangChain for data indexing — not implemented.',
    pricing: 'free',
    status: 'not-started',
    phaseLabel: 'Phase 3 (documented)',
    docsUrl: 'https://docs.llamaindex.ai/',
  },
  {
    name: 'Pinecone',
    whatItIs: 'A managed vector database — stores embeddings and finds similar ones fast.',
    whatItDoes:
      'Provides a hosted, horizontally scalable index for high-dimensional vectors with approximate nearest-neighbor search, plus metadata filtering.',
    whyUseIt: 'Use it when you need production-grade vector search without operating your own infrastructure.',
    howWeUseIt:
      'PineconeService stores document chunk embeddings in a namespace-scoped serverless index and runs cosine similarity search for SearchService/RagService.',
    pricing: 'freemium',
    status: 'implemented',
    phaseLabel: 'Phase 3 ✅',
    docsUrl: 'https://docs.pinecone.io/',
  },
  {
    name: 'Weaviate',
    whatItIs: 'An open-source vector database — an alternative to Pinecone, self-hostable.',
    whatItDoes:
      'Offers the same core capability as Pinecone (vector storage + similarity search) but can be self-hosted, with built-in hybrid (vector + keyword) search.',
    whyUseIt: 'Use it when you want to avoid vendor lock-in or need to run the vector store inside your own infrastructure.',
    howWeUseIt: 'Documented as an alternative to Pinecone — not implemented.',
    pricing: 'freemium',
    status: 'not-started',
    phaseLabel: 'Documented',
    docsUrl: 'https://weaviate.io/developers/weaviate',
  },
  {
    name: 'Node.js OpenAI SDK',
    whatItIs: "The official npm package for calling OpenAI's API from JavaScript/TypeScript.",
    whatItDoes:
      "Wraps every OpenAI REST endpoint in a typed client, handling auth headers, retries at the transport level, and streaming iterators.",
    whyUseIt: 'Use it instead of hand-rolling HTTP calls — it stays in sync with the API and provides full TypeScript types.',
    howWeUseIt: 'Core dependency (openai npm package). A single client instance is created and provided app-wide via the OPENAI_CLIENT injection token.',
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 1',
    docsUrl: 'https://github.com/openai/openai-node',
  },
  {
    name: 'tiktoken',
    whatItIs: "OpenAI's tokenizer compiled to WebAssembly — counts tokens exactly like the API does.",
    whatItDoes:
      'Implements the exact byte-pair-encoding (BPE) vocabulary each OpenAI model uses, so token counts computed locally match what the API bills for.',
    whyUseIt: 'Use it whenever you need an exact (not estimated) token count before or after a call.',
    howWeUseIt: 'TokenService.countTokens() uses it for exact billing and context-window budgeting, with per-model encoder caching.',
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 1',
    docsUrl: 'https://github.com/openai/tiktoken',
  },
  {
    name: 'mathjs',
    whatItIs: 'A math expression parser and evaluator — a safe alternative to eval().',
    whatItDoes:
      "Parses and evaluates mathematical expressions using its own grammar, never falling through to JavaScript's eval or new Function, so arbitrary code injection isn't possible.",
    whyUseIt: 'Use it whenever untrusted input needs to be evaluated as a math expression.',
    howWeUseIt: "Powers the calculator built-in tool in function calling, with a 200-character input cap and a finite-result check.",
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 2',
    docsUrl: 'https://mathjs.org/docs/',
  },
  {
    name: 'Open-Meteo',
    whatItIs: 'A free weather API — no API key required, geocoding + forecast.',
    whatItDoes: 'Provides free, keyless HTTP endpoints for geocoding a city name and fetching current weather conditions.',
    whyUseIt: 'Use it for weather features in demos or learning projects where signing up for a paid weather API key is unnecessary friction.',
    howWeUseIt: 'Powers the weather built-in tool — WeatherTool geocodes a city, then fetches current conditions and maps the WMO weather code to a human-readable string.',
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 2',
    docsUrl: 'https://open-meteo.com/en/docs',
  },
  {
    name: 'Prisma',
    whatItIs: 'A TypeScript ORM for database access — type-safe queries, migrations, schema management.',
    whatItDoes:
      "Generates a fully-typed client from a schema file, handling migrations, connection pooling (via an adapter), and query building without hand-written SQL.",
    whyUseIt: 'Use it when you want compile-time safety on database queries and a single source of truth for the schema.',
    howWeUseIt: 'All database access in the app goes through Prisma — DatabaseService extends PrismaClient and is injected globally.',
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 1',
    docsUrl: 'https://www.prisma.io/docs',
  },
  {
    name: '@faker-js/faker',
    whatItIs: 'A library for generating realistic fake data — names, emails, addresses, text.',
    whatItDoes: 'Generates randomized but plausible-looking data across many categories, useful for seeding databases or load-testing pipelines.',
    whyUseIt: 'Use it whenever you need volume test data without hand-authoring it or exposing real user data.',
    howWeUseIt:
      'MockDataService generates faker-based mock documents and Q&A pairs (category-specific templates plus generated names/dates/versions) for RAG testing and evaluation.',
    pricing: 'free',
    status: 'implemented',
    phaseLabel: 'Phase 3 ✅',
    docsUrl: 'https://fakerjs.dev/',
  },
];

export const PRACTICES: PracticeEntry[] = [
  {
    name: 'Always Use System Prompts',
    status: 'implemented',
    whatItMeans:
      'Never send a conversation to the model without an opening instruction message that sets its role and boundaries.',
    whyItMatters:
      "Skip this and the model falls back to generic default behavior — inconsistent tone, no guardrails, and no way to steer it away from off-topic requests.",
    howWeFollowIt:
      'Every ChatConversation has a systemPrompt field, and 6 seed prompt templates demonstrate different system-prompt strategies (support agent, code reviewer, summarizer, etc.).',
    codeExample: `// ChatService.buildContext() — system prompt is always synthesized first,
// never persisted as a ChatMessage row
const messages = [
  { role: 'system', content: conversation.systemPrompt ?? DEFAULT_SYSTEM_PROMPT },
  ...trimmedHistory,
];`,
  },
  {
    name: 'Exponential Backoff',
    status: 'implemented',
    whatItMeans: 'When a call fails with a retryable error, wait progressively longer before trying again.',
    whyItMatters:
      'Retrying instantly against a rate-limited or overloaded provider just produces more 429s — backoff gives it room to recover and avoids making things worse.',
    howWeFollowIt:
      'RetryService implements backoff with jitter specifically on 429/500/503 status codes, tracked per-call via a retryTracker.',
    codeExample: `// retry.service.ts
private calculateDelay(attempt: number): number {
  const exponential = this.baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * this.baseDelayMs * this.jitterFactor;
  return exponential + jitter;
}`,
  },
  {
    name: 'Test Prompt Variations',
    status: 'implemented',
    whatItMeans: "Don't guess which prompt or model works best — run the same input through multiple options and compare.",
    whyItMatters:
      'Prompt quality is empirical, not obvious from reading the text — small wording changes can flip correctness or tone.',
    howWeFollowIt:
      'POST /openai/prompt-test runs a prompt against a named template; POST /openai/compare runs one prompt across multiple models side by side.',
    codeExample: `// openai.controller.ts
@Post('prompt-test')
async promptTest(@Body() dto: PromptTestDto): Promise<PromptTestResBody> { ... }

@Post('compare')
async compareModels(@Body() dto: ModelCompareDto): Promise<ModelCompareResDto> { ... }`,
  },
  {
    name: 'Log Everything',
    status: 'implemented',
    whatItMeans: 'Record every single AI call, not just the failures — success, failure, and retried attempts alike.',
    whyItMatters:
      "Partial logging (errors only) can't answer cost or usage questions, and can't distinguish 'model was slow' from 'model was down'.",
    howWeFollowIt:
      'AiAuditService.log() writes one row per AI call with full token/cost/latency detail, called from every OpenaiService and ChatService code path — including streamed turns.',
    codeExample: `// ai-audit.service.ts
async log(event: AiAuditLogEvent): Promise<void> {
  // fire-and-forget write to ai_audit_logs — never blocks the caller
}`,
  },
  {
    name: 'Cache Embeddings',
    status: 'implemented',
    whatItMeans:
      "Don't re-embed the same text twice — store the vector once it's computed and reuse it.",
    whyItMatters:
      'Embedding calls cost money and add latency; re-embedding unchanged documents on every query wastes both for no benefit.',
    howWeFollowIt:
      'Implemented — EmbeddingCacheService hashes normalized text with SHA-256 and checks the embedding_cache table before calling OpenaiService.generateEmbedding(), used by both DocumentService (ingestion) and SearchService (query embeddings).',
    codeExample: `// embedding-cache.service.ts
async get(text: string): Promise<number[] | null> {
  const textHash = this.hash(text); // SHA-256 of text.trim().toLowerCase()
  const cached = await this.databaseService.embeddingCache.findUnique({ where: { textHash } });
  return cached ? (cached.embedding as number[]) : null;
}`,
  },
];

export const PRACTICE_APPS: PracticeAppEntry[] = [
  {
    name: 'App 1: Knowledge Base Q&A',
    description: 'Answer questions grounded in a private document set instead of the model’s general knowledge.',
    skills: ['Vector Embeddings', 'Semantic Search', 'RAG', 'Vector Databases'],
    status: 'implemented',
    statusNote:
      '✅ Implemented — document upload/ingestion, chunking + embeddings, Pinecone-backed semantic search, and RAG Q&A with citations are all live on the Knowledge Base page, including mock data generation and accuracy evaluation.',
    link: '/knowledge-base',
  },
  {
    name: 'App 2: AI Chat Assistant',
    description: 'A multi-turn conversational assistant with streaming output and tool use.',
    skills: ['Chat Completions', 'Streaming', 'Function Calling', 'Context Windows', 'Audit Logging'],
    status: 'implemented',
    statusNote:
      'Multi-turn conversations, SSE streaming, and function calling with the calculator, weather, and datetime tools are all live.',
    link: '/chat',
  },
  {
    name: 'App 3: Content Moderation',
    description: 'Automatically detect and block harmful or policy-violating content.',
    skills: ['Content Filtering', 'Moderation APIs'],
    status: 'implemented',
    statusNote:
      '✅ Implemented — /moderation page with a standalone moderation tester (single + batch, full category score grid), filterable moderation logs, and violation stats. Chat and RAG inputs are guarded server-side (422 on flagged content).',
    link: '/moderation',
  },
];

export const API_PARAMETERS: ApiParameterEntry[] = [
  {
    name: 'model',
    type: 'string',
    usage: 'used',
    plainEnglish:
      'Which AI brain answers you. Different models are like choosing between a quick intern, a seasoned expert, or a specialist — same job, different skill and price.',
    technical:
      'Identifies the exact model/checkpoint to route the request to. Accepts a native OpenAI model id (e.g. gpt-4o) or an OpenRouter-style provider/model[:variant] string. Required on every request.',
    defaultValue: 'tencent/hy3:free (openai.defaultModel config)',
    example: '"model": "tencent/hy3:free"',
  },
  {
    name: 'messages',
    type: 'array',
    usage: 'used',
    plainEnglish:
      "The whole conversation so far, in order — like handing someone the full chat transcript before asking them to reply, instead of just the latest line.",
    technical:
      "An ordered array of { role, content } objects (system/user/assistant/tool). The model has no memory between requests — everything it needs to respond has to be in this array.",
    defaultValue:
      'Built by ChatService.buildContext() — sliding window trimmed to fit contextWindow * contextWindowPercentage',
    example: '[{ "role": "system", "content": "..." }, { "role": "user", "content": "What\'s 2+2?" }]',
  },
  {
    name: 'temperature',
    type: 'number (0–2)',
    usage: 'used',
    plainEnglish:
      'A creativity dial. Turn it down and the model gives the same safe, predictable answer every time; turn it up and it starts improvising.',
    technical:
      "Scales the probability distribution over next-token choices before sampling. 0 ≈ greedy/deterministic, 1 = the model's default calibration, 2 = near-uniform randomness (often incoherent).",
    defaultValue: '0.7',
    example: '"temperature": 0.7',
  },
  {
    name: 'max_tokens',
    type: 'number',
    usage: 'used',
    plainEnglish:
      'A hard cap on how long the answer can be — like telling someone "answer in 200 words or less," except it can cut them off mid-sentence.',
    technical:
      "Maximum number of tokens the model may generate in its completion. Generation stops early (finish_reason: 'length') once hit, even mid-word.",
    defaultValue: '1024',
    example: '"max_tokens": 1024',
  },
  {
    name: 'tools',
    type: 'array',
    usage: 'used',
    plainEnglish:
      'The list of tools the AI is allowed to reach for — like handing someone a calculator and a phone book before asking a question, so they can look things up instead of guessing.',
    technical:
      "An array of { type: 'function', function: { name, description, parameters } } JSON Schema definitions. Only attached when conversation.toolsEnabled is true — omitted entirely otherwise, not even as an empty array.",
    defaultValue: 'Only sent when toolsEnabled=true — built by ToolRegistryService.getToolDefinitions()',
    example: '[{ "type": "function", "function": { "name": "calculator", "parameters": { ... } } }]',
  },
  {
    name: 'stream',
    type: 'boolean',
    usage: 'used',
    plainEnglish:
      'Get the answer as it\'s being typed, instead of waiting for the whole thing to finish first — like watching someone type a text message live instead of getting it all at once when they hit send.',
    technical:
      'When true, the response is delivered as a sequence of Server-Sent Events, each carrying a small delta of the completion, instead of one JSON object.',
    defaultValue:
      'true only on POST /chat/conversations/:publicId/messages/stream (via StreamingService); false everywhere else',
    example: '"stream": true',
  },
  {
    name: 'top_p',
    type: 'number (0–1)',
    usage: 'available',
    plainEnglish:
      'An alternative creativity dial that works by trimming the list of possible next words down to the most likely ones, instead of reshaping the whole list the way temperature does.',
    technical:
      "Nucleus sampling — only tokens whose cumulative probability mass falls within the top_p threshold are considered for sampling. OpenAI recommends altering temperature or top_p, not both at once.",
    example: '"top_p": 0.9',
  },
  {
    name: 'top_k',
    type: 'number',
    usage: 'available',
    plainEnglish:
      'Only consider the K most likely next words, ignoring everything else, no matter how the probabilities are spread.',
    technical:
      "Restricts sampling to the K highest-probability tokens. Not part of OpenAI's own Chat Completions API — some OpenRouter-routed models accept it as an extra field.",
    example: '"top_k": 40',
  },
  {
    name: 'frequency_penalty',
    type: 'number (-2 to 2)',
    usage: 'available',
    plainEnglish:
      'Discourages the AI from repeating the same words over and over — the more a word has already appeared, the less likely it is to reuse it.',
    technical:
      "Subtracts a penalty from a token's logit proportional to how many times it has already appeared in the completion so far. Positive values reduce repetition.",
    example: '"frequency_penalty": 0.5',
  },
  {
    name: 'presence_penalty',
    type: 'number (-2 to 2)',
    usage: 'available',
    plainEnglish: 'Nudges the AI to bring up new topics instead of circling back to ones it already mentioned.',
    technical:
      "Applies a flat penalty to any token that has appeared at least once already, regardless of count — unlike frequency_penalty this doesn't scale with how many times it repeated.",
    example: '"presence_penalty": 0.3',
  },
  {
    name: 'stop',
    type: 'string | string[]',
    usage: 'available',
    plainEnglish:
      'A trigger phrase that tells the AI "stop talking the instant you write this" — like a stop sign for text generation.',
    technical:
      'A string or list of up to 4 sequences; generation halts immediately (before emitting the sequence) if any of them is produced.',
    example: '"stop": ["\\n\\n", "END"]',
  },
  {
    name: 'seed',
    type: 'number',
    usage: 'available',
    plainEnglish: 'A way to make the AI give (roughly) the same answer every time for the same question, for testing purposes.',
    technical:
      "Requests best-effort deterministic sampling — the same seed plus the same parameters tends to reproduce the same output, though OpenAI doesn't guarantee bit-for-bit determinism.",
    example: '"seed": 42',
  },
  {
    name: 'n',
    type: 'number',
    usage: 'available',
    plainEnglish: 'Ask for several different answers to the same question in one go, so you can pick the best one.',
    technical:
      'Number of independent completions to generate for the same prompt, returned as separate entries in the choices array. Multiplies token cost by n.',
    example: '"n": 3',
  },
  {
    name: 'logprobs',
    type: 'boolean',
    usage: 'available',
    plainEnglish: 'Show how confident the AI was about each word it chose, not just the word itself.',
    technical:
      'When true, returns the log probability of each output token (and optionally alternates via top_logprobs) alongside the completion.',
    example: '"logprobs": true',
  },
  {
    name: 'logit_bias',
    type: 'object',
    usage: 'available',
    plainEnglish: 'Manually make specific words more or less likely to appear — or ban them outright — before the AI even starts answering.',
    technical:
      "A map of token ID → bias (-100 to 100) applied directly to that token's logit before sampling. -100 effectively bans the token; 100 makes it near-guaranteed.",
    example: '"logit_bias": { "50256": -100 }',
  },
  {
    name: 'response_format',
    type: 'object',
    usage: 'available',
    plainEnglish: 'Force the AI to reply in a specific shape, like "only answer in valid JSON," instead of free-form prose.',
    technical:
      "Set to { type: 'json_object' } (or the newer json_schema mode) to constrain output to valid JSON matching a given schema, enforced by the API rather than just requested in the prompt.",
    example: '"response_format": { "type": "json_object" }',
  },
  {
    name: 'tool_choice',
    type: 'string | object',
    usage: 'available',
    plainEnglish:
      "Decide whether the AI is allowed to use tools, must use one, or isn't allowed to at all — rather than leaving it up to the model's judgment.",
    technical:
      "'auto' (default, model decides), 'required' (must call a tool), 'none' (never call a tool), or { type: 'function', function: { name } } to force one specific tool.",
    example: '"tool_choice": "required"',
  },
  {
    name: 'parallel_tool_calls',
    type: 'boolean',
    usage: 'available',
    plainEnglish: 'Let the AI ask for several tools at once in a single turn, instead of one at a time.',
    technical:
      'Controls whether the model can return multiple tool_calls entries in one response for concurrent execution. Defaults to true when tools are provided.',
    example: '"parallel_tool_calls": false',
  },
  {
    name: 'user',
    type: 'string',
    usage: 'available',
    plainEnglish: 'A stable ID for whoever is asking, so the AI provider can spot abuse patterns coming from the same person.',
    technical:
      'An opaque end-user identifier forwarded to OpenAI for abuse/rate-limit monitoring; not stored or used by this app.',
    example: '"user": "user_8f3a2b"',
  },
  {
    name: 'service_tier',
    type: 'string',
    usage: 'available',
    plainEnglish: 'Pay extra to jump the queue and get faster, more consistent response times.',
    technical:
      "Selects OpenAI's processing priority ('auto', 'default', or 'flex'), affecting latency and pricing for supported models.",
    example: '"service_tier": "auto"',
  },
  {
    name: 'store',
    type: 'boolean',
    usage: 'available',
    plainEnglish: 'Tell OpenAI to keep a copy of this exact conversation so it can later be used to fine-tune or evaluate models.',
    technical:
      "When true, persists the request/response pair on OpenAI's side for use with the Evals/fine-tuning APIs.",
    example: '"store": false',
  },
  {
    name: 'metadata',
    type: 'object',
    usage: 'available',
    plainEnglish: "Attach your own custom labels to a request, purely for your own tracking on OpenAI's dashboard.",
    technical:
      "Up to 16 key-value string pairs attached to the request for filtering/searching in OpenAI's usage dashboard — has no effect on the model's behavior.",
    example: '"metadata": { "project": "onboarding-bot" }',
  },
  {
    name: 'max_completion_tokens',
    type: 'number',
    usage: 'available',
    plainEnglish:
      'A newer version of the response-length cap, designed for reasoning models that also spend hidden tokens "thinking" before answering.',
    technical:
      'Replaces max_tokens for o-series/reasoning models — the cap covers both visible output and internal reasoning tokens, unlike the older parameter.',
    example: '"max_completion_tokens": 2048',
  },
];

export const RESPONSE_FIELDS: ResponseFieldEntry[] = [
  {
    name: 'id',
    type: 'string',
    plainEnglish: 'A unique ID for this specific API call/response, like a receipt number — useful for looking up a request later.',
    technical: 'A chatcmpl-prefixed unique identifier for the completion object.',
    example: '"id": "chatcmpl-9abc123"',
  },
  {
    name: 'model',
    type: 'string',
    plainEnglish:
      'Confirms which model actually generated the answer — useful when you requested a generic alias and want to know the exact version that responded.',
    technical: 'The specific model (and sometimes snapshot/version) that served the request; can differ from the requested alias.',
    example: '"model": "meta-llama/llama-3.3-70b-instruct"',
  },
  {
    name: 'choices[0].message.content',
    type: 'string | null',
    plainEnglish: 'The actual text answer from the AI.',
    technical: "The assistant message's text content; null when the model only returned a tool call instead of a text answer.",
    example: '"content": "The answer is 4."',
  },
  {
    name: 'choices[0].message.tool_calls',
    type: 'array | undefined',
    plainEnglish: 'The list of tools the AI wants to use, along with what arguments to call them with.',
    technical:
      'Present only when the model decided to call one or more tools instead of (or alongside) replying with text; each entry has an id, type, and function { name, arguments }.',
    example:
      '[{ "id": "call_1", "type": "function", "function": { "name": "calculator", "arguments": "{\\"expression\\":\\"2+2\\"}" } }]',
  },
  {
    name: 'choices[0].finish_reason',
    type: "'stop' | 'length' | 'tool_calls' | 'content_filter'",
    plainEnglish:
      'Why the AI stopped talking — did it finish naturally, get cut off, decide to use a tool, or get blocked by a safety filter?',
    technical:
      'stop = natural end of the response; length = hit max_tokens; tool_calls = the model wants a function executed before continuing; content_filter = moderation blocked the output.',
    example: '"finish_reason": "stop"',
  },
  {
    name: 'usage.prompt_tokens',
    type: 'number',
    plainEnglish: 'How many tokens your input (the conversation you sent) cost.',
    technical: 'Token count of the messages array as sent to the model.',
    example: '"prompt_tokens": 342',
  },
  {
    name: 'usage.completion_tokens',
    type: 'number',
    plainEnglish: "How many tokens the AI's answer cost.",
    technical: 'Token count of the generated completion only.',
    example: '"completion_tokens": 128',
  },
  {
    name: 'usage.total_tokens',
    type: 'number',
    plainEnglish: 'The full bill for this one call — input plus output combined.',
    technical:
      'prompt_tokens + completion_tokens. This is the number TokenService/AiAuditService multiply by the per-model price to estimate cost.',
    example: '"total_tokens": 470',
  },
  {
    name: 'system_fingerprint',
    type: 'string',
    plainEnglish:
      "A version tag for the model's exact backend configuration, so you can tell if OpenAI changed something under the hood between two calls.",
    technical:
      'Identifies the backend configuration snapshot that served the request; changes when the provider updates model weights or serving infra — useful for reproducibility debugging.',
    example: '"system_fingerprint": "fp_44709d6fcb"',
  },
  {
    name: 'created',
    type: 'number',
    plainEnglish: 'The exact moment the response was generated, as a timestamp.',
    technical: 'Unix timestamp (seconds) of when the completion was created.',
    example: '"created": 1720400000',
  },
];
