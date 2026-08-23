import { apiClient, unwrap } from '@/api/client';
import type {
  Budget,
  BudgetAlert,
  BudgetStatusResponse,
  CreateBudgetRequest,
  PaginatedBudgetsResponse,
  ProjectedSpend,
  QueryBudgetsParams,
  RetentionConfig,
  RetentionReport,
  RetentionStats,
  SpendAnalyticsQueryParams,
  SpendByFeatureResponse,
  SpendByModelResponse,
  SpendByUserQueryParams,
  SpendByUserResponse,
  SpendTimelineQueryParams,
  SpendTimelineResponse,
  UpdateBudgetRequest,
  UpdateRetentionConfigRequest,
} from '@/types/cost';

// ── Budgets ───────────────────────────────────────────────────────────────

export function createBudget(payload: CreateBudgetRequest) {
  return unwrap<Budget>(apiClient.post('/cost/budgets', payload));
}

export function getBudgets(params: QueryBudgetsParams = {}) {
  return unwrap<PaginatedBudgetsResponse>(apiClient.get('/cost/budgets', { params }));
}

export function getBudgetByUser(userId: string) {
  return unwrap<BudgetStatusResponse>(apiClient.get(`/cost/budgets/${encodeURIComponent(userId)}`));
}

export function updateBudget(publicId: string, payload: UpdateBudgetRequest) {
  return unwrap<Budget>(apiClient.patch(`/cost/budgets/${publicId}`, payload));
}

export function deleteBudget(publicId: string) {
  return apiClient.delete(`/cost/budgets/${publicId}`);
}

export function getBudgetAlerts() {
  return unwrap<BudgetAlert[]>(apiClient.get('/cost/budgets/alerts'));
}

// ── Analytics ─────────────────────────────────────────────────────────────

export function getSpendByUser(params: SpendByUserQueryParams = {}) {
  return unwrap<SpendByUserResponse>(apiClient.get('/cost/analytics/by-user', { params }));
}

export function getSpendByModel(params: SpendAnalyticsQueryParams = {}) {
  return unwrap<SpendByModelResponse>(apiClient.get('/cost/analytics/by-model', { params }));
}

export function getSpendByFeature(params: SpendAnalyticsQueryParams = {}) {
  return unwrap<SpendByFeatureResponse>(apiClient.get('/cost/analytics/by-feature', { params }));
}

export function getSpendTimeline(params: SpendTimelineQueryParams = {}) {
  return unwrap<SpendTimelineResponse>(apiClient.get('/cost/analytics/timeline', { params }));
}

export function getDailyTrend(days?: number) {
  return unwrap<SpendTimelineResponse>(
    apiClient.get('/cost/analytics/daily-trend', { params: days ? { days } : {} }),
  );
}

export function getProjectedSpend() {
  return unwrap<ProjectedSpend>(apiClient.get('/cost/analytics/projected'));
}

// ── Data retention ────────────────────────────────────────────────────────

export function getRetentionConfig() {
  return unwrap<RetentionConfig>(apiClient.get('/retention/config'));
}

export function updateRetentionConfig(payload: UpdateRetentionConfigRequest) {
  return unwrap<RetentionConfig>(apiClient.patch('/retention/config', payload));
}

export function triggerCleanup() {
  return unwrap<RetentionReport>(apiClient.post('/retention/cleanup'));
}

export function getRetentionStats() {
  return unwrap<RetentionStats>(apiClient.get('/retention/stats'));
}
