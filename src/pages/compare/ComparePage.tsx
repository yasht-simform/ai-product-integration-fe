import { useState } from 'react';
import { Loader2, Plus, X, Zap } from 'lucide-react';

import { compareModels } from '@/api/openai';
import { ModelSelector } from '@/components/shared/ModelSelector';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { formatCost, formatLatency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DEFAULT_FREE_MODEL, type ModelCompareItem } from '@/types/openai';

const MIN_MODELS = 2;
const MAX_MODELS = 3;

export function ComparePage() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [models, setModels] = useState<string[]>([DEFAULT_FREE_MODEL, '']);
  const [temperature, setTemperature] = useState(0.7);
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<ModelCompareItem[] | null>(null);

  function updateModel(index: number, value: string) {
    setModels((prev) => prev.map((m, i) => (i === index ? value : m)));
  }

  function addModel() {
    if (models.length >= MAX_MODELS) return;
    setModels((prev) => [...prev, '']);
  }

  function removeModel(index: number) {
    if (models.length <= MIN_MODELS) return;
    setModels((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!prompt.trim() || isComparing) return;
    setIsComparing(true);
    setResults(null);
    try {
      const response = await compareModels({
        prompt: prompt.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        models,
        temperature,
      });
      setResults(response.results);
    } finally {
      setIsComparing(false);
    }
  }

  const hasEmptyModel = models.some((m) => !m.trim());
  const cheapestIndex = results ? results.reduce((best, r, i, arr) => (r.estimatedCost < arr[best].estimatedCost ? i : best), 0) : -1;
  const fastestIndex = results ? results.reduce((best, r, i, arr) => (r.latencyMs < arr[best].latencyMs ? i : best), 0) : -1;

  return (
    <div>
      <PageHeader title="Model Comparison" description="Send the same prompt to multiple models side by side." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What would you like to ask?"
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>System Prompt (optional)</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system-level instructions"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
            </div>
            <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={2} step={0.1} className="max-w-xs" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Models ({models.length}/{MAX_MODELS})</Label>
              {models.length < MAX_MODELS && (
                <Button type="button" variant="outline" size="sm" onClick={addModel}>
                  <Plus className="size-3.5" />
                  Add model
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {models.map((model, index) => (
                <div key={index} className="relative">
                  <ModelSelector value={model} onChange={(v) => updateModel(index, v)} label={`Model ${index + 1}`} />
                  {models.length > MIN_MODELS && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -right-1 -top-1 size-6"
                      onClick={() => removeModel(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!prompt.trim() || hasEmptyModel || isComparing} className="w-fit">
            {isComparing && <Loader2 className="size-4 animate-spin" />}
            Compare Models
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className={cn('mt-6 grid grid-cols-1 gap-4', results.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3')}>
          {results.map((result, index) => (
            <Card key={`${result.model}-${index}`} className={cn(index === cheapestIndex && index === fastestIndex && 'ring-2 ring-primary')}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="font-mono text-sm">{result.model}</CardTitle>
                  <div className="flex gap-1.5">
                    {index === cheapestIndex && (
                      <Badge variant="success" className="gap-1">
                        Cheapest
                      </Badge>
                    )}
                    {index === fastestIndex && (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="size-3" />
                        Fastest
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="whitespace-pre-wrap text-sm">{result.content}</p>
                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Tokens</div>
                    <div className="text-sm font-medium">{formatNumber(result.usage.totalTokens)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <div className="text-sm font-medium">{formatCost(result.estimatedCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Latency</div>
                    <div className="text-sm font-medium">{formatLatency(result.latencyMs)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
