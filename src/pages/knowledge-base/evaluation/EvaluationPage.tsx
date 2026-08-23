import { useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

import { getDocuments, runEvaluation } from '@/api/rag';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAsync } from '@/hooks/useAsync';
import { KnowledgeBaseNav } from '@/pages/knowledge-base/KnowledgeBaseNav';
import { EvaluationResults } from '@/pages/knowledge-base/evaluation/EvaluationResults';
import { GenerateSection } from '@/pages/knowledge-base/evaluation/GenerateSection';
import { QaPairsTable } from '@/pages/knowledge-base/evaluation/QaPairsTable';
import type { EvaluationResult } from '@/types/rag';

export function EvaluationPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sampleSize, setSampleSize] = useState(50);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const documents = useAsync(() => getDocuments({ limit: 100 }), [refreshKey]);
  const documentTitleById = Object.fromEntries(
    (documents.data?.data ?? []).map((d) => [d.publicId, d.title]),
  );

  async function handleEvaluate() {
    setIsEvaluating(true);
    try {
      const evaluation = await runEvaluation({ sampleSize });
      setResult(evaluation);
      toast.success('Evaluation complete');
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Mock Data & Evaluation"
        description="Generate synthetic documents and Q&A pairs, then measure RAG answer accuracy."
      />

      <KnowledgeBaseNav />

      <div className="flex flex-col gap-6">
        <GenerateSection onGenerated={() => setRefreshKey((k) => k + 1)} />

        <QaPairsTable documentTitleById={documentTitleById} refreshKey={refreshKey} />

        <Card>
          <CardHeader>
            <CardTitle>Run Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label>Sample size (max 200)</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Number(e.target.value) || 1)}
                  className="w-32"
                />
              </div>
              <Button onClick={handleEvaluate} disabled={isEvaluating}>
                {isEvaluating ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                {isEvaluating ? 'Evaluating…' : 'Run Evaluation'}
              </Button>
            </div>
            {isEvaluating && (
              <p className="text-xs text-muted-foreground">
                Each question runs a real embedding + vector search + generation call — this can take
                a while for larger sample sizes.
              </p>
            )}
          </CardContent>
        </Card>

        {result && <EvaluationResults result={result} />}
      </div>
    </div>
  );
}
