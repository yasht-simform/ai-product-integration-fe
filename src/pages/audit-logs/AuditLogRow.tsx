import { ChevronDown, ChevronRight } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCost, formatDateTime, formatLatency, formatNumber } from '@/lib/format';
import type { AiAuditLog } from '@/types/openai';

export function AuditLogRow({
  log,
  isExpanded,
  onToggle,
}: {
  log: AiAuditLog;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell>
          {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
        <TableCell className="font-mono text-xs">{log.model}</TableCell>
        <TableCell>
          <StatusBadge status={log.status} />
        </TableCell>
        <TableCell className="text-right">{formatNumber(log.totalTokens)}</TableCell>
        <TableCell className="text-right">{formatCost(log.estimatedCost)}</TableCell>
        <TableCell className="text-right">{formatLatency(log.latencyMs)}</TableCell>
        <TableCell className="text-right">{log.retryCount}</TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={8} className="whitespace-normal py-4">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {log.systemPrompt && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">System Prompt</div>
                  <p className="whitespace-pre-wrap rounded-md bg-background p-2 text-xs">{log.systemPrompt}</p>
                </div>
              )}
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">User Message</div>
                <p className="whitespace-pre-wrap rounded-md bg-background p-2 text-xs">{log.userMessage}</p>
              </div>
              {log.assistantResponse && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Assistant Response</div>
                  <p className="whitespace-pre-wrap rounded-md bg-background p-2 text-xs">{log.assistantResponse}</p>
                </div>
              )}
              {log.errorMessage && (
                <div>
                  <div className="mb-1 text-xs font-medium text-destructive">Error</div>
                  <p className="whitespace-pre-wrap rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                    {log.errorCode ? `[${log.errorCode}] ` : ''}
                    {log.errorMessage}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground md:col-span-2">
                <span>Request ID: {log.requestId}</span>
                {log.temperature !== undefined && <span>Temperature: {log.temperature}</span>}
                {log.maxTokens !== undefined && <span>Max Tokens: {log.maxTokens}</span>}
                <span>Input tokens: {formatNumber(log.inputTokens)}</span>
                <span>Output tokens: {formatNumber(log.outputTokens)}</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
