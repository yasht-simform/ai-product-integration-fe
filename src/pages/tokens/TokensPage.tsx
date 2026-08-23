import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';

import { countTokens, getModelPricing } from '@/api/openai';
import { ModelSelector } from '@/components/shared/ModelSelector';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAsync } from '@/hooks/useAsync';
import { formatCost, formatNumber } from '@/lib/format';
import { DEFAULT_FREE_MODEL, type TokenCountResponse } from '@/types/openai';

export function TokensPage() {
  const [text, setText] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_FREE_MODEL);
  const [isCounting, setIsCounting] = useState(false);
  const [result, setResult] = useState<TokenCountResponse | null>(null);

  const pricing = useAsync(getModelPricing, []);

  async function handleCount() {
    if (!text.trim() || isCounting) return;
    setIsCounting(true);
    try {
      const response = await countTokens({ text, model });
      setResult(response);
    } finally {
      setIsCounting(false);
    }
  }

  const modelPricing = result ? pricing.data?.pricing[result.model] : undefined;
  const inputCost = modelPricing ? (result!.tokenCount / 1_000_000) * modelPricing.input : undefined;
  const outputCost = modelPricing ? (result!.tokenCount / 1_000_000) * modelPricing.output : undefined;

  return (
    <div>
      <PageHeader title="Token Calculator" description="Count exact tokens for any text and estimate cost per model." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Text</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text to count tokens…"
              rows={10}
            />
            <div className="flex items-end gap-3">
              <div className="w-72">
                <ModelSelector value={model} onChange={setModel} />
              </div>
              <Button onClick={handleCount} disabled={!text.trim() || isCounting}>
                {isCounting ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
                Count Tokens
              </Button>
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
                <StatBlock label="Tokens" value={formatNumber(result.tokenCount)} />
                <StatBlock label="Characters" value={formatNumber(result.characterCount)} />
                <StatBlock label="Cost as input" value={inputCost !== undefined ? formatCost(inputCost) : '—'} />
                <StatBlock label="Cost as output" value={outputCost !== undefined ? formatCost(outputCost) : '—'} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Pricing</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {pricing.isLoading ? (
              <div className="space-y-2 px-6 pb-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Input /1M</TableHead>
                    <TableHead className="text-right">Output /1M</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(pricing.data?.pricing ?? {}).map(([modelName, price]) => (
                    <TableRow key={modelName}>
                      <TableCell className="font-mono text-xs">{modelName}</TableCell>
                      <TableCell className="text-right">${price.input.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${price.output.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
