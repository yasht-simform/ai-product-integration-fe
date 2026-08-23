// Mirrors ai-product-integration-be: src/modules/capstone/{types,dto}/*
import type { EvaluationResult } from './rag';

export interface CapstoneSeedResult {
  documents: number;
  chunks: number;
  vectors: number;
  qaPairs: number;
  conversations: number;
  budgets: number;
  evaluation: EvaluationResult;
  summary: string;
}

export interface CapstoneResetResult {
  documentsDeleted: number;
  conversationsDeleted: number;
  budgetsDeleted: number;
  summary: string;
}

export interface CapstoneStatusResult {
  ready: boolean;
  documents: number;
  chunks: number;
  vectors: number;
  qaPairs: number;
  conversations: number;
  budgets: number;
  lastEvaluation: EvaluationResult | null;
}
