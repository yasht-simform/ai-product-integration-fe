# Frontend Capstone — Prompts Reference

> Prompt to give to Claude Code for the FE project after BE capstone is complete.

---

## Prompt: Demo Mode + Final Polish

```
Working in the ai-product-integration-fe project. The capstone backend is complete — full demo dataset seeded (50 docs, 250 Q&A pairs), integration tests passing, all 4 phases working together. Backend at http://localhost:3000/api/v1.

## New Backend Endpoints

- POST /api/v1/capstone/seed — seed full demo dataset (50 docs + Q&A + conversations + budgets)
- POST /api/v1/capstone/reset — clean all demo data
- GET /api/v1/capstone/status — demo readiness: { documents, chunks, vectors, qaPairs, conversations, budgets, evaluationAccuracy, isReady }
- POST /api/v1/capstone/run-evaluation — run full evaluation, returns accuracy report

## What to Build

### 1. Demo Control Panel on Dashboard

Add a "Demo Controls" card to the Dashboard page (bottom section):

- **Status indicator**: "Demo Ready ✅" or "Demo Not Seeded ⚠️" — from GET /capstone/status
- Show: documents count, vectors count, Q&A pairs, evaluation accuracy %
- Three buttons:
  - "Seed Demo Data" → POST /capstone/seed (with loading spinner, shows progress toast, takes 2-5 min)
  - "Run Evaluation" → POST /capstone/run-evaluation (shows accuracy result when done)
  - "Reset Demo" → POST /capstone/reset (confirmation dialog first, then clears everything)
- Collapse/expand — don't clutter the dashboard when not needed

### 2. Demo Walkthrough Guide (Optional but impressive)

Add a small "?" or "Guide" button in the header that opens a slide-over panel with the demo script:

- Step-by-step guide: "1. Start here → 2. Try this → 3. Notice this"
- Each step links to the relevant page
- Checkboxes so the presenter can track progress during a live demo
- Can be dismissed and re-opened
- Content is static (hardcoded from the demo script)

Steps:
1. Dashboard — "Notice the stat cards showing total API calls, models, and system health"
2. Knowledge Base → Documents — "50 documents loaded across 5 categories"
3. Knowledge Base → Q&A — "Ask: What is CloudPulse's return policy? → See RAG answer with citations"
4. Chat — "Create a conversation, watch streaming responses word-by-word"
5. Chat + Tools — "Enable tools, ask: What's 15% of 2499? → See calculator tool call"
6. Moderation — "Test text in the moderation tester, see category scores"
7. Cost Management — "View budgets, analytics charts, projected monthly spend"
8. Models — "Browse 340+ models from 56 providers"
9. Pricing — "Compare costs across models with the calculator"
10. Glossary — "Reference guide for all concepts and tools"

### 3. API Client Updates

Add to src/api/:

```typescript
// Capstone
seedDemoData(): Promise<SeedResult>
resetDemoData(): Promise<void>
getDemoStatus(): Promise<DemoStatus>
runDemoEvaluation(): Promise<EvaluationResult>
```

Types:
```typescript
interface DemoStatus {
  documents: number;
  chunks: number;
  vectors: number;
  qaPairs: number;
  conversations: number;
  budgets: number;
  evaluationAccuracy: number | null;
  isReady: boolean;
}

interface SeedResult {
  documents: number;
  chunks: number;
  vectors: number;
  qaPairs: number;
  conversations: number;
  budgets: number;
  durationMs: number;
}
```

### 4. Final Playwright Verification

Update scripts/verify-ui.ts to:
- Verify all 15 pages (12 existing + moderation + cost + retention)
- After verification, print a final summary:
  "AI Product Integration — All X pages verified, 0 console errors"

## Design Notes
- Demo Controls card: subtle, doesn't dominate the dashboard — use a collapsible card with a "Demo" badge
- Seed button should have a warning: "This will add 50 documents and take 2-5 minutes"
- Reset button needs a confirmation dialog: "This will delete all demo data. Are you sure?"
- Guide panel: slide from right, semi-transparent backdrop, can scroll
- Keep it clean — this is the finishing touch, not a new feature
```
