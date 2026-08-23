import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { getToolIcon } from '@/lib/tool-icons';
import { cn } from '@/lib/utils';
import type { ToolExecutionResult } from '@/types/chat';

interface ToolCallCardProps {
  name: string;
  args: Record<string, unknown>;
  result?: ToolExecutionResult;
}

export function ToolCallCard({ name, args, result }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getToolIcon(name);
  const isPending = !result;
  const isError = result && (!result.success || result.error);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border bg-card text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium">{name} called</span>
        {isPending ? (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="size-3 animate-spin" />
            Running
          </Badge>
        ) : isError ? (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            Failed
          </Badge>
        ) : (
          <Badge variant="success">Done</Badge>
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 border-t px-3 py-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Input</p>
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Output</p>
            {isPending ? (
              <p className="text-xs text-muted-foreground">Waiting for result…</p>
            ) : (
              <pre
                className={cn(
                  'overflow-x-auto rounded-md p-2 text-xs',
                  isError ? 'bg-destructive/10 text-destructive' : 'bg-muted',
                )}
              >
                {JSON.stringify(result.error ?? result.result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
