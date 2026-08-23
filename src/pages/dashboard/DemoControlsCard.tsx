import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, PlayCircle, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { getDemoStatus, resetDemoData, runDemoEvaluation, seedDemoData } from '@/api/capstone';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAsync } from '@/hooks/useAsync';
import { formatNumber } from '@/lib/format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

// Composes the capstone module's 4 endpoints (POST /capstone/seed|reset|run-evaluation,
// GET /capstone/status) into a single collapsible control panel — proving all 4 phases
// (chat, RAG, safety, cost) work together via one demo dataset, without cluttering the
// dashboard when collapsed.
export function DemoControlsCard() {
  const status = useAsync(getDemoStatus, []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const busy = isSeeding || isEvaluating || isResetting;

  async function handleSeed() {
    setIsSeeding(true);
    const toastId = toast.loading('Seeding demo dataset — 50 documents + evaluation, this can take 2-5 minutes…');
    try {
      const result = await seedDemoData();
      toast.success(result.summary, { id: toastId, duration: 10_000 });
      status.refetch();
    } catch {
      // the API interceptor already shows an error toast — just clear the loading one
      toast.dismiss(toastId);
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleRunEvaluation() {
    setIsEvaluating(true);
    try {
      const result = await runDemoEvaluation();
      toast.success(
        `Evaluation complete: ${(result.accuracy * 100).toFixed(0)}% accuracy (${result.correct}/${result.totalQuestions} correct)`,
      );
      status.refetch();
    } catch {
      // toast already shown by the API interceptor
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      const result = await resetDemoData();
      toast.success(result.summary);
      status.refetch();
    } catch {
      // toast already shown by the API interceptor
    } finally {
      setIsResetting(false);
    }
  }

  const data = status.data;
  const accuracy = data?.lastEvaluation ? Math.round(data.lastEvaluation.accuracy * 100) : null;

  return (
    <Card className="mt-6">
      <CardHeader
        className="cursor-pointer flex-row items-center justify-between space-y-0 select-none"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            Demo Controls
          </CardTitle>
          <Badge variant="outline">Demo</Badge>
          {!status.isLoading && (
            <Badge variant={data?.ready ? 'success' : 'warning'}>
              {data?.ready ? 'Demo Ready ✅' : 'Demo Not Seeded ⚠️'}
            </Badge>
          )}
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((v) => !v);
            }}
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </CardAction>
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Documents" value={formatNumber(data?.documents ?? 0)} />
            <Stat label="Vectors" value={formatNumber(data?.vectors ?? 0)} />
            <Stat label="Q&A Pairs" value={formatNumber(data?.qaPairs ?? 0)} />
            <Stat label="Evaluation Accuracy" value={accuracy !== null ? `${accuracy}%` : '—'} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSeed} disabled={busy}>
              {isSeeding ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isSeeding ? 'Seeding…' : 'Seed Demo Data'}
            </Button>
            <Button variant="outline" onClick={handleRunEvaluation} disabled={busy}>
              {isEvaluating ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
              {isEvaluating ? 'Evaluating…' : 'Run Evaluation'}
            </Button>
            <Button variant="destructive" onClick={() => setConfirmResetOpen(true)} disabled={busy}>
              {isResetting ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Reset Demo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Seeding adds 50 documents (fully embedded in Pinecone), 250 Q&amp;A pairs, sample
            conversations, and sample budgets — it takes 2-5 minutes.
          </p>
        </CardContent>
      )}

      <ConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title="Reset demo data?"
        description="This will delete all demo data — 50 documents (with their chunks and Q&A pairs), the sample conversations, and the sample budgets. Are you sure?"
        confirmLabel="Reset Demo"
        destructive
        onConfirm={handleReset}
      />
    </Card>
  );
}
