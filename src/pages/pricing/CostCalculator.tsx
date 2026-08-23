import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';

import { calculatePricing } from '@/api/openai';
import { ModelSelector } from '@/components/shared/ModelSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatCost } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DEFAULT_FREE_MODEL, ModelTier, type PricingCalculateResponse } from '@/types/openai';

const PRESETS = [
  { label: '100 tokens', value: 100 },
  { label: '1K tokens', value: 1_000 },
  { label: '10K tokens', value: 10_000 },
  { label: '100K tokens', value: 100_000 },
  { label: '1M tokens', value: 1_000_000 },
];

const MIN_MODELS = 2;
const MAX_MODELS = 3;

export function CostCalculator() {
  const [compareMode, setCompareMode] = useState(false);
  const [models, setModels] = useState<string[]>([DEFAULT_FREE_MODEL]);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [results, setResults] = useState<Record<string, PricingCalculateResponse | null>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const debouncedInputTokens = useDebouncedValue(inputTokens, 400);
  const debouncedOutputTokens = useDebouncedValue(outputTokens, 400);
  const debouncedModelsKey = useDebouncedValue(models.join('|'), 400);

  function toggleCompareMode() {
    setCompareMode((prev) => {
      const next = !prev;
      setModels((current) => {
        if (next) return current.length >= MIN_MODELS ? current : [...current, ''];
        return [current[0] || DEFAULT_FREE_MODEL];
      });
      return next;
    });
  }

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

  useEffect(() => {
    const activeModels = debouncedModelsKey.split('|').filter(Boolean);
    if (activeModels.length === 0) {
      setResults({});
      return;
    }

    let cancelled = false;
    setIsCalculating(true);
    Promise.all(
      activeModels.map((modelId) =>
        calculatePricing({
          modelId,
          inputTokens: debouncedInputTokens,
          outputTokens: debouncedOutputTokens,
        })
          .then((res) => [modelId, res] as const)
          .catch(() => [modelId, null] as const),
      ),
    )
      .then((entries) => {
        if (cancelled) return;
        setResults(Object.fromEntries(entries));
      })
      .finally(() => {
        if (!cancelled) setIsCalculating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedModelsKey, debouncedInputTokens, debouncedOutputTokens]);

  function applyPreset(value: number) {
    setInputTokens(value);
    setOutputTokens(value);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Cost Calculator</CardTitle>
        <Button variant="outline" size="sm" onClick={toggleCompareMode}>
          {compareMode ? 'Single Model' : 'Compare Models'}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Input Tokens</Label>
            <Input
              type="number"
              min={0}
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Output Tokens</Label>
            <Input
              type="number"
              min={0}
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {compareMode && (
            <div className="flex items-center justify-between">
              <Label>
                Models ({models.length}/{MAX_MODELS})
              </Label>
              {models.length < MAX_MODELS && (
                <Button type="button" variant="outline" size="sm" onClick={addModel}>
                  <Plus className="size-3.5" />
                  Add model
                </Button>
              )}
            </div>
          )}
          <div className={cn('grid grid-cols-1 gap-3', compareMode && 'sm:grid-cols-3')}>
            {models.map((model, index) => (
              <div key={index} className="relative">
                <ModelSelector
                  value={model}
                  onChange={(v) => updateModel(index, v)}
                  label={compareMode ? `Model ${index + 1}` : 'Model'}
                />
                {compareMode && models.length > MIN_MODELS && (
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

        {isCalculating ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Calculating…
          </div>
        ) : (
          <div
            className={cn(
              'grid grid-cols-1 gap-3',
              compareMode && models.length > 1 && 'sm:grid-cols-3',
            )}
          >
            {models.map((modelId, index) => {
              if (!modelId) return null;
              const result = results[modelId];
              if (!result) return null;
              const isFree = result.totalCost === 0;
              return (
                <div
                  key={`${modelId}-${index}`}
                  className={cn(
                    'rounded-lg border p-4',
                    isFree &&
                      'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs">{result.model}</span>
                    <Badge variant={result.tier === ModelTier.FREE ? 'success' : 'warning'}>
                      {result.tier}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{result.provider}</p>
                  {isFree ? (
                    <p className="mt-3 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                      Free — $0.00
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">Input</div>
                        <div className="text-sm font-medium">{formatCost(result.inputCost)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Output</div>
                        <div className="text-sm font-medium">{formatCost(result.outputCost)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-sm font-semibold">{formatCost(result.totalCost)}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
