import { useState } from 'react';
import { Clock, Info, Loader2, Pencil, Play } from 'lucide-react';
import { toast } from 'sonner';

import { getRetentionConfig, getRetentionStats, triggerCleanup, updateRetentionConfig } from '@/api/cost';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsync } from '@/hooks/useAsync';
import { formatDateTime, formatLatency, formatNumber } from '@/lib/format';
import type { RetentionConfig, RetentionReport } from '@/types/cost';

const CONFIG_FIELDS: { key: keyof Omit<RetentionConfig, 'cron'>; label: string }[] = [
  { key: 'auditDays', label: 'Audit Logs' },
  { key: 'moderationDays', label: 'Moderation Logs' },
  { key: 'archivedConversationDays', label: 'Archived Conversations' },
  { key: 'embeddingCacheDays', label: 'Embedding Cache' },
];

const DUE_ROWS: { key: 'auditLogs' | 'moderationLogs' | 'archivedConversations' | 'embeddingCache'; label: string }[] = [
  { key: 'auditLogs', label: 'Audit logs' },
  { key: 'moderationLogs', label: 'Moderation logs' },
  { key: 'archivedConversations', label: 'Archived conversations' },
  { key: 'embeddingCache', label: 'Embedding cache' },
];

function cleanupSummary(report: RetentionReport): string {
  return (
    `Deleted: ${formatNumber(report.auditLogs.deleted)} audit logs, ` +
    `${formatNumber(report.moderationLogs.deleted)} moderation logs, ` +
    `${formatNumber(report.archivedConversations.deleted)} conversations, ` +
    `${formatNumber(report.embeddingCache.deleted)} cache entries ` +
    `(took ${formatLatency(report.durationMs)})`
  );
}

export function RetentionPage() {
  const config = useAsync(getRetentionConfig, []);
  const stats = useAsync(getRetentionStats, []);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [lastRunReport, setLastRunReport] = useState<RetentionReport | null>(null);

  function startEditing() {
    if (!config.data) return;
    setDraft(Object.fromEntries(CONFIG_FIELDS.map(({ key }) => [key, String(config.data![key])])));
    setIsEditing(true);
  }

  async function handleSave() {
    const payload: Record<string, number> = {};
    for (const { key, label } of CONFIG_FIELDS) {
      const value = Number(draft[key]);
      if (!Number.isInteger(value) || value < 1) {
        toast.error(`${label} must be a whole number of days (≥ 1)`);
        return;
      }
      if (config.data && value !== config.data[key]) payload[key] = value;
    }
    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateRetentionConfig(payload);
      toast.success('Retention config updated (in-memory — resets on server restart)');
      setIsEditing(false);
      config.refetch();
      stats.refetch();
    } catch {
      // toast already shown by the API interceptor
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCleanup() {
    setIsCleaning(true);
    try {
      const report = await triggerCleanup();
      setLastRunReport(report);
      const failures = DUE_ROWS.filter(({ key }) => report[key].failed);
      if (failures.length > 0) {
        toast.warning(`Cleanup finished with failures in: ${failures.map((f) => f.label).join(', ')}`);
      } else {
        toast.success(cleanupSummary(report));
      }
      stats.refetch();
    } catch {
      // toast already shown by the API interceptor
    } finally {
      setIsCleaning(false);
    }
  }

  const report = lastRunReport ?? stats.data?.lastReport ?? null;
  const rowsDue = stats.data?.rowsDue;
  const totalDue = rowsDue
    ? rowsDue.auditLogs + rowsDue.moderationLogs + rowsDue.archivedConversations + rowsDue.embeddingCache
    : 0;

  return (
    <div>
      <PageHeader
        title="Data Retention"
        description="Time-based cleanup of logs, archived conversations, and stale embedding cache."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Retention Periods</CardTitle>
            {!isEditing && (
              <CardAction>
                <Button variant="outline" size="sm" onClick={startEditing} disabled={config.isLoading}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {config.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <>
                {CONFIG_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex h-11 items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={draft[key] ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                          className="h-8 w-24 text-right"
                        />
                        <span className="w-8 text-sm text-muted-foreground">days</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium">{config.data?.[key]} days</span>
                    )}
                  </div>
                ))}
                <div className="flex h-11 items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Cleanup Schedule</span>
                  <span className="flex items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{config.data?.cron}</code>
                    <Badge variant="outline" className="text-muted-foreground">not editable</Badge>
                  </span>
                </div>

                {isEditing && (
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving && <Loader2 className="size-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                )}

                <Separator className="my-3" />
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Changes are in-memory only and reset on server restart. Rows older than a period are
                  deleted by the scheduled cleanup; active conversations are never touched.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cleanup Status</CardTitle>
            <CardAction>
              <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={isCleaning || stats.isLoading}>
                {isCleaning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Run Cleanup Now
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {stats.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex h-11 items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Last cleanup</span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {report ? formatDateTime(report.ranAt) : 'Never'}
                  </span>
                </div>
                {DUE_ROWS.map(({ key, label }) => (
                  <div key={key} className="flex h-11 items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{label} due</span>
                    <span className="flex items-center gap-3 text-sm">
                      {report && (
                        <span className="text-xs text-muted-foreground">
                          last run: {formatNumber(report[key].deleted)} deleted
                          {report[key].failed && (
                            <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">failed</Badge>
                          )}
                        </span>
                      )}
                      <span className={rowsDue && rowsDue[key] > 0 ? 'font-semibold' : 'font-medium text-muted-foreground'}>
                        {formatNumber(rowsDue?.[key] ?? 0)}
                      </span>
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex h-11 items-center justify-between gap-4">
                  <span className="text-sm font-medium">Total records due</span>
                  <span className="text-lg font-semibold">{formatNumber(totalDue)}</span>
                </div>
                {report && (
                  <p className="text-xs text-muted-foreground">
                    Last run deleted {formatNumber(report.totalDeleted)} records in {formatLatency(report.durationMs)}.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Run cleanup now?"
        description={`This permanently deletes ${formatNumber(totalDue)} records that are past their retention period. Active conversations are never affected.`}
        confirmLabel="Run Cleanup"
        destructive
        onConfirm={handleCleanup}
      />
    </div>
  );
}
