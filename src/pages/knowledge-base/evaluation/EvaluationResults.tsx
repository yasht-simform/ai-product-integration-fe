import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatLatency, formatNumber } from '@/lib/format';
import { QA_COMPLEXITY_LABELS, QaComplexity, type EvaluationResult } from '@/types/rag';

const TIER_ORDER: QaComplexity[] = [QaComplexity.SIMPLE, QaComplexity.MULTI_STEP, QaComplexity.EDGE_CASE];

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'var(--chart-3)';
  if (pct >= 60) return 'var(--chart-4)';
  return 'var(--destructive)';
}

export function EvaluationResults({ result }: { result: EvaluationResult }) {
  const overallPct = Math.round(result.accuracy * 100);
  const chartData = TIER_ORDER.filter((tier) => result.byComplexity[tier]).map((tier) => {
    const breakdown = result.byComplexity[tier];
    return {
      tier: QA_COMPLEXITY_LABELS[tier],
      accuracy: Math.round(breakdown.accuracy * 100),
      total: breakdown.total,
      correct: breakdown.correct,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Overall Accuracy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">{overallPct}%</span>
            <span className="text-sm text-muted-foreground">
              {result.correct} of {result.totalQuestions} correct
            </span>
          </div>
          <Progress value={overallPct} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Total" value={formatNumber(result.totalQuestions)} />
        <Stat label="Correct" value={formatNumber(result.correct)} />
        <Stat label="Partially Correct" value={formatNumber(result.partiallyCorrect)} />
        <Stat label="Incorrect" value={formatNumber(result.incorrect)} />
        <Stat label="Appropriate IDK" value={formatNumber(result.appropriateIDK)} />
        <Stat label="Avg Latency" value={formatLatency(result.avgLatencyMs)} />
        <Stat label="Avg Tokens" value={formatNumber(Math.round(result.avgTokens))} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accuracy by Complexity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="tier" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.tier} fill={accuracyColor(entry.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-6">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}
