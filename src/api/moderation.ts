import { apiClient, unwrap } from '@/api/client';
import type {
  CheckBatchModerationRequest,
  CheckModerationRequest,
  ModerationResult,
  ModerationStats,
  ModerationStatsQueryParams,
  PaginatedModerationLogsResponse,
  QueryModerationLogsParams,
} from '@/types/moderation';

export function checkModeration(payload: CheckModerationRequest) {
  return unwrap<ModerationResult>(apiClient.post('/moderation/check', payload));
}

export function checkModerationBatch(payload: CheckBatchModerationRequest) {
  return unwrap<ModerationResult[]>(apiClient.post('/moderation/check-batch', payload));
}

export function getModerationLogs(params: QueryModerationLogsParams = {}) {
  return unwrap<PaginatedModerationLogsResponse>(apiClient.get('/moderation/logs', { params }));
}

export function getModerationStats(params: ModerationStatsQueryParams = {}) {
  return unwrap<ModerationStats>(apiClient.get('/moderation/stats', { params }));
}
