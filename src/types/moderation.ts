// Mirrors ai-product-integration-be: src/modules/moderation/{constants,dto,types}/*

export const ModerationDirection = {
  INPUT: 'input',
  OUTPUT: 'output',
} as const;
export type ModerationDirection = (typeof ModerationDirection)[keyof typeof ModerationDirection];

export const ModerationAction = {
  ALLOWED: 'allowed',
  BLOCKED: 'blocked',
  REPLACED: 'replaced',
} as const;
export type ModerationAction = (typeof ModerationAction)[keyof typeof ModerationAction];

// OpenAI's 11 moderation categories (spec §4.1) — used to render the full category grid even
// when a result/log only carries scores for a subset.
export const ModerationCategory = {
  HATE: 'hate',
  HATE_THREATENING: 'hate/threatening',
  HARASSMENT: 'harassment',
  HARASSMENT_THREATENING: 'harassment/threatening',
  SELF_HARM: 'self-harm',
  SELF_HARM_INTENT: 'self-harm/intent',
  SELF_HARM_INSTRUCTIONS: 'self-harm/instructions',
  SEXUAL: 'sexual',
  SEXUAL_MINORS: 'sexual/minors',
  VIOLENCE: 'violence',
  VIOLENCE_GRAPHIC: 'violence/graphic',
} as const;
export type ModerationCategory = (typeof ModerationCategory)[keyof typeof ModerationCategory];

// ── Check ─────────────────────────────────────────────────────────────────

export interface CheckModerationRequest {
  text: string;
  source?: string;
}

export interface CheckBatchModerationRequest {
  texts: string[];
}

export interface ModerationResult {
  isFlagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  flaggedCategories: string[];
  highestScore: { category: string; score: number };
}

// ── Logs ──────────────────────────────────────────────────────────────────

export interface ModerationLog {
  publicId: string;
  requestId?: string;
  userId?: string;
  direction: ModerationDirection | string;
  content: string;
  isFlagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  action: ModerationAction | string;
  source: string;
  createdAt: string;
}

export interface QueryModerationLogsParams {
  userId?: string;
  isFlagged?: boolean;
  direction?: ModerationDirection;
  source?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedModerationLogsResponse {
  data: ModerationLog[];
  total: number;
  page: number;
  limit: number;
}

// ── Stats ─────────────────────────────────────────────────────────────────

export interface ModerationStatsQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface TopFlaggedCategory {
  category: string;
  count: number;
}

export interface ModerationStats {
  totalChecks: number;
  flaggedCount: number;
  violationRate: number;
  byDirection: { input: number; output: number };
  topCategories: TopFlaggedCategory[];
}
