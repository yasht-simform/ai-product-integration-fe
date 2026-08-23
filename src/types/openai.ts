// Mirrors ai-product-integration-be: src/modules/openai/constants/*.enum.ts
// Plain const objects (not TS `enum`) — required by this project's erasableSyntaxOnly tsconfig.
export const OpenAIModel = {
  GPT_4: 'gpt-4',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
} as const;
export type OpenAIModel = (typeof OpenAIModel)[keyof typeof OpenAIModel];

export const AiAuditStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  RETRIED: 'RETRIED',
} as const;
export type AiAuditStatus = (typeof AiAuditStatus)[keyof typeof AiAuditStatus];

export const PromptTechnique = {
  SYSTEM_PROMPT: 'system-prompt',
  FEW_SHOT: 'few-shot',
  ROLE_PLAY: 'role-play',
  STRUCTURED_OUTPUT: 'structured-output',
  CHAIN_OF_THOUGHT: 'chain-of-thought',
  TEMPERATURE_TUNING: 'temperature-tuning',
} as const;
export type PromptTechnique = (typeof PromptTechnique)[keyof typeof PromptTechnique];

export const PROMPT_TECHNIQUE_LABELS: Record<PromptTechnique, string> = {
  [PromptTechnique.SYSTEM_PROMPT]: 'System Prompt',
  [PromptTechnique.FEW_SHOT]: 'Few-Shot',
  [PromptTechnique.ROLE_PLAY]: 'Role Play',
  [PromptTechnique.STRUCTURED_OUTPUT]: 'Structured Output',
  [PromptTechnique.CHAIN_OF_THOUGHT]: 'Chain of Thought',
  [PromptTechnique.TEMPERATURE_TUNING]: 'Temperature Tuning',
};

// ── Chat / completion ────────────────────────────────────────────────────

export interface ChatCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: Usage;
  estimatedCost: number;
  latencyMs: number;
}

// ── Model comparison ─────────────────────────────────────────────────────

export interface ModelCompareRequest {
  prompt: string;
  systemPrompt?: string;
  models?: string[];
  temperature?: number;
}

export interface ModelCompareItem {
  model: string;
  content: string;
  usage: Usage;
  estimatedCost: number;
  latencyMs: number;
}

export interface ModelCompareResponse {
  results: ModelCompareItem[];
}

// ── Prompt test ───────────────────────────────────────────────────────────

export interface PromptTestRequest extends ChatCompletionRequest {
  templateName?: string;
}

export interface PromptTestResponse extends ChatCompletionResponse {
  tokenBreakdown: {
    systemPromptTokens: number;
    userMessageTokens: number;
  };
}

// ── Token counting ───────────────────────────────────────────────────────

export interface TokenCountRequest {
  text: string;
  model?: string;
}

export interface TokenCountResponse {
  text: string;
  model: string;
  tokenCount: number;
  characterCount: number;
}

// ── Pricing ───────────────────────────────────────────────────────────────

export interface ModelPricingItem {
  input: number;
  output: number;
}

export interface ModelPricingResponse {
  pricing: Record<string, ModelPricingItem>;
}

// ── Health ────────────────────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface HealthResponse {
  circuitState: CircuitState;
  status: 'ok' | 'degraded';
}

// ── Prompt templates ─────────────────────────────────────────────────────

export interface FewShotExample {
  input: string;
  output: string;
}

export interface PromptTemplate {
  publicId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  fewShotExamples?: FewShotExample[];
  technique: string;
  recommendedModel: string;
  recommendedTemperature: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptTemplateRequest {
  name: string;
  description?: string;
  systemPrompt: string;
  fewShotExamples?: FewShotExample[];
  technique: PromptTechnique;
  recommendedModel?: string;
  recommendedTemperature?: number;
  tags?: string[];
  isActive?: boolean;
}

export type UpdatePromptTemplateRequest = Partial<CreatePromptTemplateRequest>;

export interface QueryPromptTemplateParams {
  technique?: PromptTechnique;
  tags?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedPromptTemplateResponse {
  data: PromptTemplate[];
  total: number;
}

// ── Audit logs ────────────────────────────────────────────────────────────

export interface AiAuditLog {
  publicId: string;
  requestId: string;
  userId?: string;
  model: string;
  endpoint: string;
  systemPrompt?: string;
  userMessage: string;
  assistantResponse?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  temperature?: number;
  maxTokens?: number;
  status: AiAuditStatus | string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}

export interface QueryAiAuditParams {
  model?: string;
  status?: AiAuditStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAiAuditResponse {
  data: AiAuditLog[];
  total: number;
  page: number;
  limit: number;
}

// ── Cost summary ──────────────────────────────────────────────────────────

export interface CostSummaryQueryParams {
  userId?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
}

export interface ModelCostBreakdown {
  model: string;
  cost: number;
  callCount: number;
}

export interface CostSummaryResponse {
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  callCount: number;
  averageLatencyMs: number;
  perModelBreakdown: ModelCostBreakdown[];
}

// ── Model registry ───────────────────────────────────────────────────────

export const ModelTier = {
  FREE: 'free',
  PAID: 'paid',
} as const;
export type ModelTier = (typeof ModelTier)[keyof typeof ModelTier];

export const ModelSource = {
  OPENROUTER_SYNC: 'openrouter_sync',
  MANUAL: 'manual',
} as const;
export type ModelSource = (typeof ModelSource)[keyof typeof ModelSource];

// Not native OpenAI — used as the default selection across model pickers since
// OPENAI_DEFAULT_MODEL on the backend defaults to this free OpenRouter model.
export const DEFAULT_FREE_MODEL = 'tencent/hy3:free';

export interface Provider {
  publicId: string;
  name: string;
  slug: string;
  baseUrl?: string;
  description?: string;
  isActive: boolean;
  modelCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderRequest {
  name: string;
  slug: string;
  baseUrl?: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateProviderRequest = Partial<CreateProviderRequest>;

export interface AIModel {
  publicId: string;
  providerPublicId: string;
  providerName: string;
  name: string;
  modelId: string;
  tier: ModelTier;
  inputPricePer1M: number;
  outputPricePer1M: number;
  contextWindow?: number;
  description?: string;
  source: ModelSource;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModelRequest {
  providerId: string;
  name: string;
  modelId: string;
  tier: ModelTier;
  inputPricePer1M?: number;
  outputPricePer1M?: number;
  contextWindow?: number;
  description?: string;
  isActive?: boolean;
}

export type UpdateModelRequest = Partial<CreateModelRequest>;

export interface QueryModelsParams {
  tier?: ModelTier;
  providerId?: string;
  search?: string;
  source?: ModelSource;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedModelResponse {
  data: AIModel[];
  total: number;
  page: number;
  limit: number;
}

// ── Pricing table / calculator ─────────────────────────────────────────────

export interface PricingTableModel {
  modelId: string;
  name: string;
  tier: ModelTier;
  inputPricePer1M: number;
  outputPricePer1M: number;
}

export interface PricingTableProviderGroup {
  provider: string;
  slug: string;
  models: PricingTableModel[];
}

export interface PricingTableResponse {
  providers: PricingTableProviderGroup[];
}

export interface PricingCalculateRequest {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface PricingCalculateResponse {
  model: string;
  provider: string;
  tier: ModelTier;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  note: string;
}

// ── OpenRouter sync ─────────────────────────────────────────────────────────

export interface SyncResultResponse {
  providersCreated: number;
  modelsCreated: number;
  modelsUpdated: number;
}

export interface SyncStatusResponse {
  lastSyncedAt?: string;
  modelsCount: number;
  providersCount: number;
}
