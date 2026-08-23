import { useState } from 'react';
import { History } from 'lucide-react';

import { getAuditLogs, getCostSummary } from '@/api/openai';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
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
import { AuditLogRow } from '@/pages/audit-logs/AuditLogRow';
import { AiAuditStatus } from '@/types/openai';

const PAGE_SIZE = 20;
const ALL = '__all__';

export function AuditLogsPage() {
  const [model, setModel] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const modelOptions = useAsync(() => getCostSummary({}), []);

  const logs = useAsync(
    () =>
      getAuditLogs({
        model: model === ALL ? undefined : model,
        status: status === ALL ? undefined : (status as AiAuditStatus),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    [model, status, startDate, endDate, page],
  );

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
      setExpandedId(null);
    };
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every OpenAI API call made through this backend, with cost and latency." />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={resetToFirstPage(setModel)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All models</SelectItem>
                {(modelOptions.data?.perModelBreakdown ?? []).map((row) => (
                  <SelectItem key={row.model} value={row.model}>
                    {row.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={resetToFirstPage(setStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.values(AiAuditStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <EmptyState icon={History} title="No audit logs found" description="Try adjusting your filters, or make a call from the Chat Playground." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Time</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead className="text-right">Retries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.data?.data.map((log) => (
                    <AuditLogRow
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
