# Frontend Phase 4 — Prompts Reference

> Prompt to give to Claude Code for the FE project after Phase 4 BE is complete.
> Status: Ready to execute once BE Phase 4 is done.

---

## Prompt: Moderation, Cost Budgets, Analytics Dashboard, Data Retention

```
Working in the ai-product-integration-fe project. Phase 4 backend (Safety & Compliance) is complete — content moderation, per-user cost budgets, cost analytics, and data retention. Backend at http://localhost:3000/api/v1.

## New Backend Endpoints

### Moderation
- POST /api/v1/moderation/check — { text, source? } → moderation result with categories + scores
- POST /api/v1/moderation/check-batch — { texts: string[] } → array of moderation results
- GET /api/v1/moderation/logs — paginated, filterable: userId, isFlagged, direction, source, startDate, endDate
- GET /api/v1/moderation/stats — totals, violation rate, top flagged categories

### Cost Budgets
- POST /api/v1/cost/budgets — create { userId, dailyLimitUsd?, monthlyLimitUsd?, alertThreshold? }
- GET /api/v1/cost/budgets — list all budgets (paginated)
- GET /api/v1/cost/budgets/:userId — get user's budget + current spend
- PATCH /api/v1/cost/budgets/:publicId — update limits
- DELETE /api/v1/cost/budgets/:publicId — remove budget
- GET /api/v1/cost/budgets/alerts — users approaching their limits

### Cost Analytics
- GET /api/v1/cost/analytics/by-user — spend per user (paginated, sortable)
- GET /api/v1/cost/analytics/by-model — spend per model
- GET /api/v1/cost/analytics/by-feature — spend per feature (chat/embeddings/moderations)
- GET /api/v1/cost/analytics/timeline — daily spend buckets over a date range
- GET /api/v1/cost/analytics/daily-trend?days=30 — last N days spend trend
- GET /api/v1/cost/analytics/projected — projected monthly spend

### Data Retention
- GET /api/v1/retention/config — current retention settings
- PATCH /api/v1/retention/config — update retention periods (in-memory, resets on restart)
- POST /api/v1/retention/cleanup — trigger manual cleanup, returns deletion counts
- GET /api/v1/retention/stats — last cleanup time, records due for cleanup per category

### Response Shapes

ModerationResult: { isFlagged, categories: Record<string, boolean>, categoryScores: Record<string, number>, flaggedCategories: string[], highestScore: { category, score } }

ModerationLog: { publicId, requestId, userId, direction ('input'|'output'), content (truncated), isFlagged, categories, categoryScores, action ('allowed'|'blocked'|'replaced'), source, createdAt }

ModerationStats: { totalChecks, flaggedCount, violationRate, topCategories: { category, count, percentage }[], byDirection: { input: { total, flagged }, output: { total, flagged } } }

Budget: { publicId, userId, dailyLimitUsd, monthlyLimitUsd, isActive, alertThreshold, createdAt, updatedAt }

BudgetStatus: { userId, dailySpend, monthlySpend, dailyLimit, monthlyLimit, dailyPercentage, monthlyPercentage, status: 'within_budget'|'warning'|'exceeded' }

BudgetAlert: { userId, dailySpend, monthlySpend, dailyLimit, monthlyLimit, dailyPercentage, monthlyPercentage }

SpendByUser: { userId, totalCost, callCount, avgCost }[]
SpendByModel: { model, totalCost, callCount, avgCost }[]
SpendByFeature: { feature, totalCost, callCount, avgCost }[]
SpendTimeline: { date: string, totalCost: number, callCount: number }[]
ProjectedSpend: { monthToDateSpend, daysElapsed, daysInMonth, dailyAverage, projectedMonthly }

RetentionConfig: { auditLogRetentionDays, moderationLogRetentionDays, archivedConversationRetentionDays, embeddingCacheRetentionDays, cleanupCron }
RetentionStats: { lastCleanupAt, auditLogsDue, moderationLogsDue, archivedConversationsDue, embeddingCacheDue }
CleanupResult: { auditLogsDeleted, moderationLogsDeleted, conversationsDeleted, embeddingCacheDeleted, durationMs }

## Pages to Build

### 1. Content Moderation (/moderation)

Safety monitoring dashboard + standalone moderation tool.

**Top Stats Row:**
- Stat cards from GET /moderation/stats: Total Checks, Flagged Count, Violation Rate (%), Top Category
- Use red/amber coloring for violation-related stats

**Two-Tab Layout:**

**Tab 1: Moderation Tester**
- Text area to input text for moderation checking
- "Check" button → POST /moderation/check
- Result display:
  - Large badge: "SAFE" (green) or "FLAGGED" (red)
  - Category grid: show ALL moderation categories as cards
    - Each card: category name, score bar (0-1), flagged/clean badge
    - Flagged categories highlighted in red
    - Clean categories in gray/muted
  - Highest score callout: "Highest: sexual (0.85)"
- "Check Batch" option: text area for multiple texts (one per line), shows results for each

**Tab 2: Moderation Logs**
- Table: timestamp, userId, direction (input/output badge), source (chat/rag/standalone badge), isFlagged (SAFE green / FLAGGED red), action (allowed/blocked/replaced), content (truncated, expandable)
- Filters: flagged status, direction, source, user, date range
- Pagination
- Click row to expand: full categories grid with scores, full content

### 2. Cost Management (/cost)

Budget management + cost analytics dashboard.

**Three-Tab Layout:**

**Tab 1: Budgets**
- Budget table: userId, daily limit, monthly limit, daily spend (with progress bar), monthly spend (with progress bar), status badge (within/warning/exceeded), alert threshold, active toggle
- "Create Budget" button → dialog: userId, daily limit ($), monthly limit ($), alert threshold (0-1 slider)
- Edit/Delete actions per row
- "Alerts" section at top: collapsible card showing users approaching limits (from GET /cost/budgets/alerts) with warning styling

**Tab 2: Analytics**
- Split into sections with cards:

  **Spend by User** — bar chart (recharts) + sortable table: user, total cost, call count, avg cost per call
  
  **Spend by Model** — horizontal bar chart: model name vs total cost, sorted by cost descending
  
  **Spend by Feature** — pie or donut chart: chat vs embeddings vs moderations, with percentages
  
  **Projected Monthly** — large card: "Projected: $X.XX this month" with daily average, days elapsed, days remaining
  
- Date range picker at top that filters all analytics sections

**Tab 3: Spend Timeline**
- Line chart (recharts): daily spend over time, x-axis = date, y-axis = cost ($)
- Period selector: Last 7 days, 14 days, 30 days, 90 days
- Below the chart: trend table with daily breakdown: date, cost, call count
- Show trend arrow: up/down compared to previous period

### 3. Data Retention (/retention)

Settings and management page for data lifecycle.

**Current Config Section:**
- Card showing current retention periods:
  - Audit Logs: 90 days
  - Moderation Logs: 90 days
  - Archived Conversations: 30 days
  - Embedding Cache: 180 days
  - Cleanup Schedule: 0 2 * * * (daily at 2 AM)
- "Edit" button → inline editing with Save/Cancel
- Note: "Changes are in-memory only and reset on server restart"

**Cleanup Status Section:**
- Card from GET /retention/stats:
  - Last cleanup: timestamp (or "Never" if not run)
  - Records due for cleanup per category: audit logs (X), moderation logs (X), archived conversations (X), embedding cache (X)
  - Total records due
- "Run Cleanup Now" button → POST /retention/cleanup
  - Shows result: "Deleted: X audit logs, Y moderation logs, Z conversations, W cache entries (took Xms)"
  - Toast notification with summary

### 4. Update Sidebar Navigation

Add new items:
- Moderation (icon: Shield or ShieldCheck) → /moderation
- Cost Management (icon: Wallet or PiggyBank) → /cost
- Data Retention (icon: Clock or Timer) → /retention

Place after Knowledge Base, before Audit Logs:
```
├── Knowledge Base
├── Moderation          ← NEW
├── Cost Management     ← NEW  
├── Data Retention      ← NEW
├── Audit Logs
└── Glossary
```

### 5. Update Dashboard

Add to the main Dashboard page:
- Moderation stat card: "Content Moderation" showing violation rate % and total checks
- Budget stat card: "Active Budgets" showing count of active budgets and users at warning/exceeded
- Or a "Safety & Governance" section with these stats grouped

### 6. API Client Updates

Add to src/api/:

```typescript
// Moderation
checkModeration(data: { text: string; source?: string }): Promise<ModerationResult>
checkModerationBatch(data: { texts: string[] }): Promise<ModerationResult[]>
getModerationLogs(params?: { isFlagged?, direction?, source?, userId?, startDate?, endDate?, page?, limit? }): Promise<PaginatedResponse<ModerationLog>>
getModerationStats(params?: { startDate?, endDate? }): Promise<ModerationStats>

// Budgets
createBudget(data: { userId: string; dailyLimitUsd?: number; monthlyLimitUsd?: number; alertThreshold?: number }): Promise<Budget>
getBudgets(params?: { page?, limit? }): Promise<PaginatedResponse<Budget>>
getBudgetByUser(userId: string): Promise<BudgetStatus>
updateBudget(publicId: string, data: Partial<Budget>): Promise<Budget>
deleteBudget(publicId: string): Promise<void>
getBudgetAlerts(): Promise<BudgetAlert[]>

// Analytics
getSpendByUser(params?: { startDate?, endDate?, page?, limit?, sortBy?, sortOrder? }): Promise<SpendByUser>
getSpendByModel(params?: { startDate?, endDate? }): Promise<SpendByModel>
getSpendByFeature(params?: { startDate?, endDate? }): Promise<SpendByFeature>
getSpendTimeline(params?: { startDate?, endDate? }): Promise<SpendTimeline>
getDailyTrend(days?: number): Promise<SpendTimeline>
getProjectedSpend(): Promise<ProjectedSpend>

// Retention
getRetentionConfig(): Promise<RetentionConfig>
updateRetentionConfig(config: Partial<RetentionConfig>): Promise<RetentionConfig>
triggerCleanup(): Promise<CleanupResult>
getRetentionStats(): Promise<RetentionStats>
```

### 7. TypeScript Types

Add all types from the Response Shapes section above to src/types/safety.ts or src/types/cost.ts.

## Design Guidelines
- Moderation page: red/warning theme for violations — red badges, red progress bars for high scores, green for safe
- Category score bars: 0-0.3 green, 0.3-0.7 amber, 0.7+ red
- Budget progress bars: green when under 60%, amber 60-80%, red above 80%
- Budget exceeded status: red badge with "EXCEEDED"
- Analytics charts: use the existing recharts color scheme (--chart-1 through --chart-5 CSS vars)
- Timeline chart: smooth line with area fill, grid lines, hover tooltip with exact values
- Retention page: clean settings-style layout, not a dashboard — think "admin settings"
- Toast for cleanup results, budget creation, moderation checks
- Loading skeletons for all data fetches
- Follow existing shadcn/Tailwind patterns
- Dark mode support via existing theme

## Important
- The moderation tester should feel like a tool you'd actually use — paste suspicious text, see detailed category breakdown
- Budget management should make overspending visually obvious (red everywhere when exceeded)
- Analytics should tell a story — "we spent $X, mostly on model Y, driven by user Z"
- The projected spend card is the most impactful single metric — make it prominent
- Retention is an admin page — functional over flashy
- Test against the running backend with real data
```

---

## Prompt: Update Glossary for Phase 4 (run after FE Phase 4 is built)

```
Update the Glossary page (/glossary) to reflect Phase 4 completion:

1. In Section 1 (Concepts), change these from "Planned" to "Implemented":
   - Content Filtering → "Implemented" — ModerationService, ModerationGuard, OpenAI moderation API (FREE), /moderation/check endpoint
   
   Add new concepts if not already present:
   - Per-User Cost Budgets → "Implemented" — CostBudgetService, CostBudgetGuard, daily/monthly limits, 429 on exceeded
   - Data Retention → "Implemented" — RetentionService, automated cron cleanup, configurable retention periods
   - Cost Analytics → "Implemented" — CostAnalyticsService, per-user/model/feature breakdowns, projected monthly spend

2. In Section 3 (Key Practices), all 5 practices should now be "Implemented"

3. In Section 4 (Practice Apps), update:
   - App 3: Content Moderation → "✅ Implemented" — /moderation page with standalone tester, moderation logs, violation stats

4. Update the progress bar count — should be close to 100% now

5. Update any "Planned (Phase 4)" references throughout the page to "Phase 4 ✅"
```
