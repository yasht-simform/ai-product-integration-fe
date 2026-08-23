import { apiClient, unwrap } from '@/api/client';
import type {
  AIModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
  CostSummaryQueryParams,
  CostSummaryResponse,
  CreateModelRequest,
  CreatePromptTemplateRequest,
  CreateProviderRequest,
  HealthResponse,
  ModelCompareRequest,
  ModelCompareResponse,
  ModelPricingResponse,
  PaginatedAiAuditResponse,
  PaginatedModelResponse,
  PaginatedPromptTemplateResponse,
  PricingCalculateRequest,
  PricingCalculateResponse,
  PricingTableResponse,
  PromptTemplate,
  PromptTestRequest,
  PromptTestResponse,
  Provider,
  QueryAiAuditParams,
  QueryModelsParams,
  QueryPromptTemplateParams,
  SyncResultResponse,
  SyncStatusResponse,
  TokenCountRequest,
  TokenCountResponse,
  UpdateModelRequest,
  UpdatePromptTemplateRequest,
  UpdateProviderRequest,
} from '@/types/openai';

// ── Chat / completion ────────────────────────────────────────────────────

export function chatCompletion(payload: ChatCompletionRequest) {
  return unwrap<ChatCompletionResponse>(apiClient.post('/openai/chat', payload));
}

export function compareModels(payload: ModelCompareRequest) {
  return unwrap<ModelCompareResponse>(apiClient.post('/openai/compare', payload));
}

export function promptTest(payload: PromptTestRequest) {
  return unwrap<PromptTestResponse>(apiClient.post('/openai/prompt-test', payload));
}

export function countTokens(payload: TokenCountRequest) {
  return unwrap<TokenCountResponse>(apiClient.post('/openai/token-count', payload));
}

// ── Prompt templates ─────────────────────────────────────────────────────

export function createTemplate(payload: CreatePromptTemplateRequest) {
  return unwrap<PromptTemplate>(apiClient.post('/openai/templates', payload));
}

export function listTemplates(params: QueryPromptTemplateParams) {
  return unwrap<PaginatedPromptTemplateResponse>(apiClient.get('/openai/templates', { params }));
}

export function getTemplate(publicId: string) {
  return unwrap<PromptTemplate>(apiClient.get(`/openai/templates/${publicId}`));
}

export function updateTemplate(publicId: string, payload: UpdatePromptTemplateRequest) {
  return unwrap<PromptTemplate>(apiClient.patch(`/openai/templates/${publicId}`, payload));
}

export function deleteTemplate(publicId: string) {
  return apiClient.delete(`/openai/templates/${publicId}`);
}

// ── Audit logs ────────────────────────────────────────────────────────────

export function getCostSummary(params: CostSummaryQueryParams) {
  return unwrap<CostSummaryResponse>(apiClient.get('/openai/audit-logs/cost-summary', { params }));
}

export function getAuditLogs(params: QueryAiAuditParams) {
  return unwrap<PaginatedAiAuditResponse>(apiClient.get('/openai/audit-logs', { params }));
}

// ── Pricing / health ──────────────────────────────────────────────────────

export function getModelPricing() {
  return unwrap<ModelPricingResponse>(apiClient.get('/openai/models/pricing'));
}

export function getHealth() {
  return unwrap<HealthResponse>(apiClient.get('/openai/health'));
}

// ── Providers ─────────────────────────────────────────────────────────────

export function getProviders() {
  return unwrap<Provider[]>(apiClient.get('/openai/providers'));
}

export function createProvider(payload: CreateProviderRequest) {
  return unwrap<Provider>(apiClient.post('/openai/providers', payload));
}

export function updateProvider(publicId: string, payload: UpdateProviderRequest) {
  return unwrap<Provider>(apiClient.patch(`/openai/providers/${publicId}`, payload));
}

export function deleteProvider(publicId: string) {
  return apiClient.delete(`/openai/providers/${publicId}`);
}

// ── Model registry ────────────────────────────────────────────────────────

export function getModels(params: QueryModelsParams = {}) {
  return unwrap<PaginatedModelResponse>(apiClient.get('/openai/models', { params }));
}

export function getFreeModels(params: QueryModelsParams = {}) {
  return unwrap<PaginatedModelResponse>(apiClient.get('/openai/models/free', { params }));
}

export function getPaidModels(params: QueryModelsParams = {}) {
  return unwrap<PaginatedModelResponse>(apiClient.get('/openai/models/paid', { params }));
}

export function createModel(payload: CreateModelRequest) {
  return unwrap<AIModel>(apiClient.post('/openai/models', payload));
}

export function updateModel(publicId: string, payload: UpdateModelRequest) {
  return unwrap<AIModel>(apiClient.patch(`/openai/models/${publicId}`, payload));
}

export function deleteModel(publicId: string) {
  return apiClient.delete(`/openai/models/${publicId}`);
}

// ── Pricing table / calculator ───────────────────────────────────────────

export function getPricingTable() {
  return unwrap<PricingTableResponse>(apiClient.get('/openai/pricing'));
}

export function calculatePricing(payload: PricingCalculateRequest) {
  return unwrap<PricingCalculateResponse>(apiClient.post('/openai/pricing/calculate', payload));
}

// ── OpenRouter sync ───────────────────────────────────────────────────────

export function triggerSync() {
  return unwrap<SyncResultResponse>(apiClient.post('/openai/sync/openrouter'));
}

export function getSyncStatus() {
  return unwrap<SyncStatusResponse>(apiClient.get('/openai/sync/status'));
}
