import { apiClient, unwrap } from '@/api/client';
import type { CapstoneResetResult, CapstoneSeedResult, CapstoneStatusResult } from '@/types/capstone';
import type { EvaluationResult } from '@/types/rag';

// Seeding embeds 50 real documents and runs a live evaluation — can take several minutes, well
// past axios's default timeout expectations elsewhere in this app, so no timeout is set here
// (the shared apiClient has no default timeout configured).
export function seedDemoData() {
  return unwrap<CapstoneSeedResult>(apiClient.post('/capstone/seed'));
}

export function resetDemoData() {
  return unwrap<CapstoneResetResult>(apiClient.post('/capstone/reset'));
}

export function getDemoStatus() {
  return unwrap<CapstoneStatusResult>(apiClient.get('/capstone/status'));
}

export function runDemoEvaluation(sampleSize?: number) {
  return unwrap<EvaluationResult>(
    apiClient.post('/capstone/run-evaluation', sampleSize !== undefined ? { sampleSize } : {}),
  );
}
