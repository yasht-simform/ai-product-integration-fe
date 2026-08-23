// Mirrors ai-product-integration-be: src/modules/cost-management/{constants,dto,types}/*

// ── Budgets ───────────────────────────────────────────────────────────────

export const BudgetStatus = {
  WITHIN_BUDGET: 'within_budget',
  APPROACHING_LIMIT: 'approaching_limit',
  EXCEEDED: 'exceeded',
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

export interface Budget {
  publicId: string;
  userId: string;
  dailyLimitUsd?: number;
  monthlyLimitUsd?: number;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  userId: string;
  dailyLimitUsd?: number;
  monthlyLimitUsd?: number;
  alertThreshold?: number;
  isActive?: boolean;
}

export type UpdateBudgetRequest = Partial<Omit<CreateBudgetRequest, 'userId'>>;

export interface QueryBudgetsParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedBudgetsResponse {
  data: Budget[];
  total: number;
  page: number;
  limit: number;
}

export interface BudgetStatusResponse {
  userId: string;
  dailySpend: number;
  monthlySpend: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyPercentage: number;
  monthlyPercentage: number;
  status: BudgetStatus;
  warning?: string;
}

export interface BudgetAlert {
  userId: string;
  dailySpend: number;
  monthlySpend: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyPercentage: number;
  monthlyPercentage: number;
  triggeredBy: 'daily' | 'monthly' | 'both';
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface SpendAnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface SpendByUserQueryParams extends SpendAnalyticsQueryParams {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface SpendByUserRow {
  userId: string;
  totalCost: number;
  totalTokens: number;
  callCount: number;
}

export interface SpendByUserResponse {
  data: SpendByUserRow[];
  total: number;
  page: number;
  limit: number;
}

export interface SpendByModelRow {
  model: string;
  totalCost: number;
  totalTokens: number;
  callCount: number;
}

export interface SpendByModelResponse {
  data: SpendByModelRow[];
}

export interface SpendByFeatureRow {
  feature: string;
  endpoint: string;
  totalCost: number;
  totalTokens: number;
  callCount: number;
}

export interface SpendByFeatureResponse {
  data: SpendByFeatureRow[];
}

export interface SpendTimelineQueryParams extends SpendAnalyticsQueryParams {
  userId?: string;
}

export interface SpendTimelinePoint {
  date: string; // YYYY-MM-DD (UTC)
  totalCost: number;
  totalTokens: number;
  callCount: number;
}

export interface SpendTimelineResponse {
  data: SpendTimelinePoint[];
}

export interface ProjectedSpend {
  monthToDate: number;
  dailyAverage: number;
  daysElapsed: number;
  daysInMonth: number;
  projected: number;
}

// ── Data retention ────────────────────────────────────────────────────────

export interface RetentionConfig {
  auditDays: number;
  moderationDays: number;
  archivedConversationDays: number;
  embeddingCacheDays: number;
  cron: string;
}

// `cron` is not runtime-updatable — the backend rejects it with a 400.
export type UpdateRetentionConfigRequest = Partial<Omit<RetentionConfig, 'cron'>>;

export interface RetentionCategoryResult {
  deleted: number;
  failed: boolean;
  error?: string;
}

export interface RetentionReport {
  auditLogs: RetentionCategoryResult;
  moderationLogs: RetentionCategoryResult;
  archivedConversations: RetentionCategoryResult;
  embeddingCache: RetentionCategoryResult;
  totalDeleted: number;
  ranAt: string;
  durationMs: number;
}

export interface RetentionRowsDue {
  auditLogs: number;
  moderationLogs: number;
  archivedConversations: number;
  embeddingCache: number;
}

export interface RetentionStats {
  lastReport: RetentionReport | null;
  rowsDue: RetentionRowsDue;
}
