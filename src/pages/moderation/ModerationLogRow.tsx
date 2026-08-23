import { ChevronDown, ChevronRight } from 'lucide-react';

import { TableCell, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/format';
import type { ModerationLog } from '@/types/moderation';

import { CategoryScoreGrid } from './CategoryScoreGrid';
import { ActionBadge, DirectionBadge, FlaggedBadge, SourceBadge } from './shared';

export function ModerationLogRow({
  log,
  isExpanded,
  onToggle,
}: {
  log: ModerationLog;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell>
          {isExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
        <TableCell className="max-w-32 truncate font-mono text-xs">{log.userId ?? '—'}</TableCell>
        <TableCell>
          <DirectionBadge direction={log.direction} />
        </TableCell>
        <TableCell>
          <SourceBadge source={log.source} />
        </TableCell>
        <TableCell>
          <FlaggedBadge isFlagged={log.isFlagged} />
        </TableCell>
        <TableCell>
          <ActionBadge action={log.action} />
        </TableCell>
        <TableCell className="max-w-64 truncate text-xs text-muted-foreground">{log.content}</TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={8} className="whitespace-normal py-4">
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Content (truncated to 1000 characters at write time)
                </div>
                <p className="whitespace-pre-wrap rounded-md bg-background p-2 text-xs">{log.content}</p>
              </div>
              <CategoryScoreGrid categories={log.categories} categoryScores={log.categoryScores} />
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {log.requestId && <span>Request ID: {log.requestId}</span>}
                {log.userId && <span>User: {log.userId}</span>}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
