# Frontend Phase 1 — Prompts Reference

> All prompts given to Claude Code for the FE project during Phase 1 and enhancements.
> Stored for reference — these have already been executed.

---

## Prompt 1: Initial FE Scaffold (6 Pages)

```
I'm building a React frontend for my AI Product Integration backend (NestJS, running at http://localhost:3000/api/v1). This is a learning/POC project for the G3 AI Product Integration goal.

## Reference Design
I have a reference UI project at ~/Desktop/L&D/AI-Product\ Integration/Machine_Pulse_AI_1/ — use it for design patterns:
- Sidebar navigation layout with icons (left side)
- Top header bar with app name and status indicators
- Dashboard with stat cards in a grid
- Clean white cards with subtle borders and shadows
- Tables with filters and pagination
- Modals for CRUD operations
- Toast notifications
- Recharts for data visualization

## Tech Stack (match the reference)
- React 18 + TypeScript + Vite
- TailwindCSS 4
- shadcn/ui components (use shadcn CLI to init properly)
- Lucide React icons
- Recharts for charts
- React Router v7 for navigation
- Axios for API calls to backend

## Backend API Base URL
http://localhost:3000/api/v1

## Pages to Build

### 1. Dashboard (/)
Overview page with:
- Stat cards row: Total API Calls, Total Cost ($), Average Latency (ms), Active Models count
- Cost breakdown chart (bar chart by model — recharts)
- Recent API calls table (last 10 from audit logs)
- Circuit breaker status indicator (from GET /openai/health)
- Data comes from: GET /openai/audit-logs/cost-summary and GET /openai/audit-logs?limit=10

### 2. Chat Playground (/chat)
The most important page — interactive chat interface:
- Left: conversation area with message bubbles (user on right, AI on left)
- Bottom: input bar with send button
- Right sidebar or top bar: model selector dropdown (allow typing custom model strings like nvidia/nemotron-3-ultra-550b-a55b:free), temperature slider, max tokens input
- Show token usage and cost after each response
- Conversation history (maintain in React state)
- API: POST /openai/chat

### 3. Model Comparison (/compare)
Side-by-side model comparison tool:
- Input: prompt text area, optional system prompt
- Select 2-3 models to compare
- Submit sends POST /openai/compare
- Results displayed in columns: model name, response content, tokens used, cost, latency
- Highlight cheapest and fastest

### 4. Prompt Templates (/templates)
CRUD management for prompt templates:
- Table listing all templates with name, technique, model, tags, active status
- Create button → modal with form (name, system prompt, technique dropdown, model, temperature, tags, few-shot examples as JSON)
- Edit and Delete actions per row
- "Test" button that opens a dialog to send a test prompt using that template
- APIs: GET/POST/PATCH/DELETE /openai/templates, POST /openai/prompt-test

### 5. Token Calculator (/tokens)
Simple utility page:
- Text area to paste text
- Model selector
- Shows: token count, character count, estimated cost as input, estimated cost as output
- API: POST /openai/token-count
- Also show the pricing table from GET /openai/models/pricing

### 6. Audit Logs (/audit-logs)
Full audit log viewer:
- Table with columns: timestamp, model, status (SUCCESS/FAILED badge), tokens, cost, latency, retry count
- Filters: model dropdown, status dropdown, date range picker
- Pagination
- Click a row to expand and see full request/response details
- API: GET /openai/audit-logs

## Design Guidelines
- Sidebar: dark or white sidebar with app name "AI Product Integration" at top, navigation items with lucide icons
- Color scheme: Use a blue/indigo primary (not orange like the reference — this is an AI product, blue feels more appropriate)
- Cards: white background, subtle border, small shadow, rounded corners
- Status badges: green for SUCCESS, red for FAILED, yellow for RETRIED
- Responsive but desktop-first (this is an internal tool)
- Dark mode support via shadcn theme toggle (nice to have)

## Project Setup
Initialize from scratch in the current directory:
1. npm create vite@latest . -- --template react-ts
2. Set up TailwindCSS 4
3. Initialize shadcn/ui with the CLI
4. Install: axios, react-router, recharts, lucide-react
5. Create the folder structure:
   src/
   ├── api/          — axios instance, API client functions
   ├── components/   — shared components (Layout, Sidebar, StatCard, etc.)
   ├── pages/        — one folder per page
   ├── hooks/        — custom hooks (useApi, etc.)
   ├── types/        — TypeScript interfaces matching backend DTOs
   └── lib/          — utils

6. Create an axios instance with baseURL from env (VITE_API_BASE_URL)
7. Create TypeScript types that match the backend response shapes
8. Build ALL 6 pages with real API integration
9. Set up React Router with sidebar layout

## Important
- Every page must make real API calls to the backend — no mock data
- Handle loading states with skeletons or spinners
- Handle error states with toast notifications
- The chat page is the hero page — make it look polished
- Create a proper .env with VITE_API_BASE_URL=http://localhost:3000/api/v1
- Add a CLAUDE.md documenting the project structure and conventions
```

---

## Prompt 2: Model Registry & Pricing UI Update

```
Working in the ai-product-integration-fe project. The backend (running at http://localhost:3000/api/v1) has been updated with a dynamic model registry. I need the frontend updated to use the new endpoints.

## New Backend Endpoints Available

### Providers
- GET /api/v1/openai/providers — returns all providers with model counts

### Models
- GET /api/v1/openai/models — all models (supports query params: tier, providerId, search, isActive, page, limit)
- GET /api/v1/openai/models/free — only free models
- GET /api/v1/openai/models/paid — only paid models
- POST /api/v1/openai/models — add custom model { name, modelId, providerId, tier, inputPricePer1M, outputPricePer1M, contextWindow, description }
- PATCH /api/v1/openai/models/:publicId — update model
- DELETE /api/v1/openai/models/:publicId — deactivate model

### Pricing
- GET /api/v1/openai/pricing — full pricing table grouped by provider
- POST /api/v1/openai/pricing/calculate — { modelId, inputTokens, outputTokens } → { model, provider, tier, inputCost, outputCost, totalCost }

### Sync
- POST /api/v1/openai/sync/openrouter — trigger manual sync
- GET /api/v1/openai/sync/status — last sync time, model count, provider count

## Changes Needed

### 1. Update ALL Model Selectors Across The App

Every page that has a model dropdown (Chat Playground, Model Comparison, Prompt Test, Token Calculator) must:
- Fetch models from GET /api/v1/openai/models instead of using a hardcoded list
- Group models in the dropdown: "Free Models" section at top, "Paid Models" section below, separated by a divider/label
- Each option shows: model name, provider name, and a badge ("Free" in green or "Paid" in amber)
- Allow typing/search to filter models (combobox pattern)
- Default selection should be the first free model (meta-llama/llama-3.3-70b-instruct:free)
- Create a shared reusable component for this: src/components/ModelSelector.tsx

### 2. New Page: Model Registry (/models)

A page to browse and manage all 340+ models:

**Top section:**
- Sync status bar: "Last synced: 2 hours ago | 340 models from 56 providers" with a "Sync Now" button (calls POST /sync/openrouter)
- Three tab filters: "All Models" | "Free" | "Paid" with counts

**Model table:**
- Columns: Provider (with icon/badge), Model Name, Model ID (monospace), Tier (Free/Paid badge), Input Price/1M, Output Price/1M, Context Window, Source (synced/manual badge), Active toggle
- Search bar to filter by model name or ID
- Filter by provider (dropdown)
- Pagination
- Click row to expand and see full details + description

**Add Custom Model button:**
- Opens a modal/dialog with form: name, modelId, select provider, tier (free/paid), input price, output price, context window, description
- This is for models not in OpenRouter — user can add any model manually

### 3. New Page: Pricing (/pricing)

**Section 1: Pricing Table**
- Fetch from GET /api/v1/openai/pricing
- Display as cards grouped by provider
- Each provider card shows: provider name, number of models, then a table of models with input/output pricing
- Free models highlighted with green background
- Paid models show actual prices
- Search/filter to find specific models quickly

**Section 2: Cost Calculator**
- Model selector (reuse the shared ModelSelector component)
- Input fields: "Input tokens" (number), "Output tokens" (number)
- Preset buttons: "100 tokens", "1K tokens", "10K tokens", "100K tokens", "1M tokens" (fills both fields)
- "Calculate" button → calls POST /api/v1/openai/pricing/calculate
- Result display: card showing model, provider, tier, input cost, output cost, total cost
- If free model selected, show "Free — $0.00" with green styling
- Add a comparison mode: select 2-3 models, calculate same token count for each, show side-by-side cost comparison

### 4. Update Sidebar Navigation

Add new items to the sidebar:
- Models (icon: Layers or Database) → /models
- Pricing (icon: DollarSign or Calculator) → /pricing

### 5. Update Dashboard

- Replace the hardcoded "Active Models" stat card with real data from GET /api/v1/openai/sync/status
- Show "340 models | 56 providers" instead of just a number
- Add a "Free models available" count

### 6. API Client Updates

Add new API functions in the api layer:
- getProviders()
- getModels(params: { tier?, providerId?, search?, page?, limit? })
- getFreeModels()
- getPaidModels()
- createModel(data)
- updateModel(publicId, data)
- deleteModel(publicId)
- getPricingTable()
- calculatePricing(data: { modelId, inputTokens, outputTokens })
- triggerSync()
- getSyncStatus()

### 7. TypeScript Types

Add types matching backend responses:
- Provider (publicId, name, slug, description, isActive, modelCount)
- AIModel (publicId, name, modelId, tier, inputPricePer1M, outputPricePer1M, contextWindow, description, source, isActive, provider)
- PricingCalculateRequest/Response
- SyncStatus (lastSyncedAt, modelCount, providerCount)

## Design Notes
- Follow the existing app's design system (shadcn/ui, Tailwind, same color scheme)
- Free = green badges/highlights, Paid = amber/orange badges
- The model registry page should handle 340+ rows efficiently (pagination, not infinite scroll)
- The pricing calculator should feel interactive — update results as user types (debounced)
- Toast notifications for sync trigger, model create/update/delete
- Loading skeletons while fetching model lists
```

---

## Prompt 3: Glossary & Learning Reference Page

```
Working in the ai-product-integration-fe project. I need a new Glossary / Learning Reference page that explains every concept, tool, and practice from my G3 AI Product Integration learning goal. This page is for me and my team to understand what everything means — both in plain English and technically.

## New Page: Glossary & Learning Reference (/glossary)

### Page Structure

Top section: A brief intro explaining this is a reference guide for the G3 AI Product Integration goal.

Then organized into 4 collapsible sections using Accordion or custom expandable cards:

### Section 1: Concepts & Learning Areas
For each concept below, show a card with:
- **Term** (bold heading)
- **Plain English** — what it means in simple words, no jargon
- **Technical Definition** — proper technical explanation
- **Why It Matters** — why this exists, what problem it solves
- **How We Implemented It** — specific reference to our codebase (which service, which endpoint, which phase)
- **Status Badge** — "Implemented" (green) or "Planned" (amber) or "Not Started" (gray)

Concepts to cover:

| Term | Plain English | Status | Where in Our App |
|---|---|---|---|
| Chat Completions | Sending a message to an AI and getting a response back | Implemented | OpenaiService.chatCompletion(), POST /openai/chat |
| Streaming Responses | Getting the AI's answer word-by-word in real time instead of waiting for the whole thing | Implemented | StreamingService, SSE endpoint /chat/conversations/:id/messages/stream |
| Function Calling (Tool Use) | The AI can use tools like a calculator or weather API to answer questions accurately | Implemented | ToolExecutorService, 3 built-in tools |
| Token Counting | Measuring the "word-pieces" that AI models charge by — like weighing a package before shipping | Implemented | TokenService.countTokens(), tiktoken |
| Prompt Engineering | Writing instructions (prompts) that make the AI behave consistently and correctly | Implemented | 6 seed prompt templates, PromptTemplateService |
| System Prompts | Hidden instructions that set the AI's personality, rules, and boundaries for a conversation | Implemented | systemPrompt field on conversations and templates |
| Few-Shot Examples | Teaching the AI by showing it examples of correct input/output pairs | Implemented | fewShotExamples field in prompt templates |
| Temperature | A knob that controls how creative vs predictable the AI's responses are (0 = robotic, 1 = creative) | Implemented | temperature parameter on all chat endpoints |
| Rate Limiting | When the AI provider says "slow down, you're sending too many requests" | Implemented | RetryService handles 429 errors with backoff |
| Exponential Backoff | Waiting longer each time you retry — 1s, 2s, 4s, 8s — so you don't overwhelm a struggling service | Implemented | RetryService.executeWithRetry() |
| Circuit Breaker | An automatic safety switch that stops calling a broken service, waits, then cautiously tries again | Implemented | RetryService circuit breaker (CLOSED/OPEN/HALF_OPEN) |
| Context Window | The maximum amount of text an AI model can "see" at once — like the model's short-term memory limit | Implemented | ChatService.buildContext() sliding window |
| Vector Embeddings | Converting text into numbers (vectors) so a computer can measure how similar two pieces of text are | Planned (Phase 3) | — |
| Semantic Search | Finding documents by meaning, not just matching keywords — "car" finds "automobile" | Planned (Phase 3) | — |
| RAG (Retrieval-Augmented Generation) | Instead of the AI guessing, first find relevant documents, then give them to the AI to answer from | Planned (Phase 3) | — |
| Content Filtering | Automatically detecting and blocking harmful, inappropriate, or policy-violating content | Planned (Phase 4) | — |
| Audit Logging | Recording every AI interaction — who asked what, which model, how much it cost, did it work | Implemented | AiAuditService, ai_audit_logs table |
| Cost Tracking | Monitoring how much money each AI call costs so spending doesn't spiral out of control | Implemented | TokenService.calculateCost(), cost-summary endpoint |
| Model Selection | Choosing the right AI model for the job — cheap & fast vs expensive & smart | Implemented | ModelRegistryService, 340+ models via OpenRouter |

### Section 2: Tools & Libraries
For each tool, show a card with:
- **Name** + logo/icon
- **What It Is** — one sentence
- **What It Does** — 2-3 sentences technical explanation
- **Why Use It / When To Use It** — use cases
- **How We Use It** — what we did in our project (or "Planned for Phase X" or "Documented as alternative")
- **Free or Paid** badge
- **Link** — official docs URL

Tools to cover:

| Tool | What It Is | Our Usage | Phase |
|---|---|---|---|
| OpenAI API | The AI service that powers GPT models | Core LLM provider, wrapped by OpenaiService | Phase 1 ✅ |
| Azure OpenAI Service | Microsoft's hosted version of OpenAI — same models, enterprise features, separate billing | Alternative provider, baseURL swap | Planned |
| OpenRouter | A gateway that routes to 400+ AI models from different providers through one API | Primary provider for free models, auto-synced model registry | Phase 1 ✅ |
| LangChain | A framework for building LLM-powered apps — chains, agents, retrievers, document loaders | Will use for RAG pipeline — document loading, chunking, retrieval chain | Phase 3 (planned) |
| LlamaIndex | A data framework for connecting LLMs to your data — indexing, querying, retrieval | Alternative to LangChain for data indexing, documented as comparison | Phase 3 (documented) |
| Pinecone | A managed vector database — stores embeddings and finds similar ones fast | Will store document embeddings for semantic search in RAG | Phase 3 (planned) |
| Weaviate | An open-source vector database — alternative to Pinecone, self-hostable | Documented as alternative to Pinecone | Documented |
| Node.js OpenAI SDK | The official npm package for calling OpenAI's API from JavaScript/TypeScript | Core dependency — openai npm package, OPENAI_CLIENT injection token | Phase 1 ✅ |
| tiktoken | OpenAI's tokenizer compiled to WebAssembly — counts tokens exactly like the API does | TokenService.countTokens() uses it for exact billing | Phase 1 ✅ |
| mathjs | A math expression parser and evaluator — safe alternative to eval() | Calculator tool in function calling | Phase 2 ✅ |
| Open-Meteo | A free weather API — no API key required, geocoding + forecast | Weather tool in function calling | Phase 2 ✅ |
| Prisma | A TypeScript ORM for database access — type-safe queries, migrations, schema management | All database access in the app goes through Prisma | Phase 1 ✅ |
| @faker-js/faker | A library for generating realistic fake data — names, emails, addresses, text | Will generate 10K+ mock Q&A pairs for RAG testing | Phase 3 (planned) |

### Section 3: Key Practices
For each practice, show a card with:
- **Practice Name**
- **What It Means** — plain English
- **Why It Matters** — what goes wrong without it
- **How We Follow It** — specific implementation in our project
- **Code Example** — short snippet or reference

Practices:

| Practice | How We Follow It |
|---|---|
| Always Use System Prompts | Every conversation has a systemPrompt field; 6 seed templates demonstrate different approaches |
| Exponential Backoff | RetryService implements backoff with jitter on 429/500/503 |
| Test Prompt Variations | POST /openai/prompt-test endpoint + POST /openai/compare for side-by-side model testing |
| Log Everything | AiAuditService logs every AI call — success, failure, retried — with full token/cost/latency detail |
| Cache Embeddings | Planned for Phase 3 — EmbeddingCache table already exists in schema |

### Section 4: Practice Apps from Goal Document
For each app, show a card with:
- **App Name** and description from the goal doc
- **What It Teaches** — skills list
- **Our Implementation Status** — what's built, what's remaining
- **How to Try It** — link to the relevant page in our FE

| App | Status | Where |
|---|---|---|
| App 1: Knowledge Base Q&A | Phase 3 — needs RAG pipeline | — |
| App 2: AI Chat Assistant | ✅ Implemented | /chat page — multi-turn conversations, streaming, function calling with calculator/weather/datetime |
| App 3: Content Moderation | Phase 4 — needs moderation API | — |

## Design Guidelines
- Use the existing app's design system (shadcn, Tailwind, same color scheme)
- Each section is collapsible (Accordion pattern) — all expanded by default
- Cards within sections: clean white cards with subtle border, icon on left, content on right
- Status badges: green "Implemented", amber "Planned", gray "Not Started"
- Search/filter at the top of the page to find any term quickly
- Add a progress bar at the top: "X of Y concepts implemented" with percentage
- Make it visually rich — not just a wall of text. Use icons, badges, and structure

## Sidebar Navigation
Add: Glossary (icon: BookOpen) → /glossary
Place it after Audit Logs in the navigation order.

## No Backend Changes Needed
This is a static content page — all data is hardcoded in the component. No API calls.
```

---

## Prompt 4: API Parameters Reference (Glossary Addition)

```
Add a new section to the Glossary page (/glossary) called "API Parameters Reference". It should appear as a 5th collapsible section after the existing 4 sections.

This section explains every parameter available in the OpenAI Chat Completions API — both the ones we use and the ones we don't. For each parameter show:
- Name
- Type
- Plain English explanation (what it does, with an analogy)
- Technical detail
- "We Use This" (green badge) or "Available" (gray badge)
- Our default value (if we use it)

Parameters we USE (green badge):
- model (string) — which AI brain. Default: meta-llama/llama-3.3-70b-instruct:free
- messages (array) — conversation history. Built by ChatService.buildContext()
- temperature (0-2) — creativity dial. 0=robotic, 1=creative, 2=chaotic. Default: 0.7
- max_tokens (number) — response length cap. Default: 1024
- tools (array) — functions the model can call. Only when toolsEnabled=true
- stream (boolean) — token-by-token SSE streaming. true in /messages/stream

Parameters we DON'T use (gray badge):
- top_p (0-1) — alternative to temperature, considers top probability tokens
- top_k (number) — only top K probable tokens
- frequency_penalty (-2 to 2) — penalizes word repetition
- presence_penalty (-2 to 2) — encourages new topics
- stop (string/array) — stop sequences to end generation
- seed (number) — reproducibility for testing
- n (number) — generate multiple responses at once
- logprobs (boolean) — show token probabilities
- logit_bias (object) — force/ban specific tokens
- response_format (object) — force JSON output
- tool_choice (string/object) — control tool usage (auto/required/none)
- parallel_tool_calls (boolean) — allow multiple tool calls at once
- user (string) — end-user ID for abuse tracking
- service_tier (string) — priority processing level
- store (boolean) — save for OpenAI fine-tuning
- metadata (object) — custom tags for tracking
- max_completion_tokens (number) — newer version of max_tokens for reasoning models

Also add a "Response Fields" sub-section showing what the API returns:
- id, model, choices[0].message.content, choices[0].message.tool_calls, choices[0].finish_reason (stop/length/tool_calls/content_filter), usage.prompt_tokens, usage.completion_tokens, usage.total_tokens, system_fingerprint, created

Make each parameter card interactive — clicking it expands to show a full explanation with example values. Use the same card/accordion pattern as the rest of the glossary page.
```
