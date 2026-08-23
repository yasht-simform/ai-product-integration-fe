import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { getModerationLogs } from '@/api/moderation';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ModerationDirection } from '@/types/moderation';

import { ModerationLogRow } from './ModerationLogRow';

const PAGE_SIZE = 20;
const ALL = '__all__';
const SOURCES = ['chat', 'rag', 'standalone'];

export function ModerationLogsTab() {
  const [flagged, setFlagged] = useState<string>(ALL);
  const [direction, setDirection] = useState<string>(ALL);
  const [source, setSource] = useState<string>(ALL);
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedUserId = useDebouncedValue(userId, 400);

  const logs = useAsync(
    () =>
      getModerationLogs({
        isFlagged: flagged === ALL ? undefined : flagged === 'flagged',
        direction: direction === ALL ? undefined : (direction as ModerationDirection),
        source: source === ALL ? undefined : source,
        userId: debouncedUserId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    [flagged, direction, source, debouncedUserId, startDate, endDate, page],
  );

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
      setExpandedId(null);
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={flagged} onValueChange={resetToFirstPage(setFlagged)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={resetToFirstPage(setDirection)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {Object.values(ModerationDirection).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={resetToFirstPage(setSource)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>User</Label>
            <Input
              value={userId}
              onChange={(e) => resetToFirstPage(setUserId)(e.target.value)}
              placeholder="Filter by user ID"
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>From</Label>
            <Input type="date" value={startDate} onChange={(e) => resetToFirstPage(setStartDate)(e.target.value)} className="w-40" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>To</Label>
            <Input type="date" value={endDate} onChange={(e) => resetToFirstPage(setEndDate)(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 pb-0">
          {logs.isLoading ? (
            <div className="space-y-2 px-6 pb-6 pt-6">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (logs.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No moderation logs found"
              description="Every moderation check (from chat, RAG, or the tester) is logged here."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Content</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.data?.data.map((log) => (
                    <ModerationLogRow
                      key={log.publicId}
                      log={log}
                      isExpanded={expandedId === log.publicId}
                      onToggle={() => setExpandedId((prev) => (prev === log.publicId ? null : log.publicId))}
                    />
                  ))}
                </TableBody>
              </Table>
              <TablePagination page={page} limit={PAGE_SIZE} total={logs.data?.total ?? 0} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
