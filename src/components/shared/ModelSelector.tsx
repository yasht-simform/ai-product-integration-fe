import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { getModels } from '@/api/openai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { ModelTier, type AIModel } from '@/types/openai';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ModelSelector({ value, onChange, label = 'Model' }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<AIModel | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    getModels({ search: debouncedQuery || undefined, limit: 100 })
      .then((res) => {
        if (!cancelled) setModels(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  // Resolve the current value against whatever's loaded so the trigger can show provider/tier
  // context instead of just the raw model id string.
  useEffect(() => {
    const match = models.find((m) => m.modelId === value);
    if (match) setSelected(match);
  }, [models, value]);

  const freeModels = useMemo(() => models.filter((m) => m.tier === ModelTier.FREE), [models]);
  const paidModels = useMemo(() => models.filter((m) => m.tier === ModelTier.PAID), [models]);
  const exactMatch = models.some((m) => m.modelId === query.trim());

  function select(model: AIModel) {
    setSelected(model);
    onChange(model.modelId);
    setOpen(false);
    setQuery('');
  }

  function useTyped() {
    const typed = query.trim();
    if (!typed) return;
    setSelected(null);
    onChange(typed);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto w-full justify-between px-3 py-2 font-normal"
          >
            <span className="flex min-w-0 flex-col items-start gap-1 text-left">
              <span className="w-full truncate font-mono text-xs">
                {value || 'Select a model…'}
              </span>
              {selected && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {selected.providerName}
                  <Badge
                    variant={selected.tier === ModelTier.FREE ? 'success' : 'warning'}
                    className="text-[10px]"
                  >
                    {selected.tier}
                  </Badge>
                </span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 max-w-[calc(100vw-2rem)] p-0" align="start">
          <div className="border-b p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models or paste a custom model id…"
              className="h-8 border-none shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <ModelGroup title="Free Models" models={freeModels} value={value} onSelect={select} />
                <ModelGroup title="Paid Models" models={paidModels} value={value} onSelect={select} />
                {freeModels.length === 0 && paidModels.length === 0 && (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No models found
                  </p>
                )}
                {query.trim() && !exactMatch && (
                  <button
                    type="button"
                    onClick={useTyped}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    Use &quot;<span className="font-mono text-xs">{query.trim()}</span>&quot;
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ModelGroup({
  title,
  models,
  value,
  onSelect,
}: {
  title: string;
  models: AIModel[];
  value: string;
  onSelect: (model: AIModel) => void;
}) {
  if (models.length === 0) return null;

  return (
    <div className="mb-1">
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{title}</div>
      {models.map((model) => (
        <button
          key={model.publicId}
          type="button"
          onClick={() => onSelect(model)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
        >
          <Check
            className={cn('size-3.5 shrink-0', model.modelId === value ? 'opacity-100' : 'opacity-0')}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{model.name}</span>
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              {model.modelId}
            </span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{model.providerName}</span>
          <Badge
            variant={model.tier === ModelTier.FREE ? 'success' : 'warning'}
            className="shrink-0 text-[10px]"
          >
            {model.tier}
          </Badge>
        </button>
      ))}
    </div>
  );
}
