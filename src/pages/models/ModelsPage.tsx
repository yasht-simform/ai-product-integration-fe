import { Fragment, useEffect, useState } from 'react';
import { Layers, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  getFreeModels,
  getModels,
  getPaidModels,
  getProviders,
  getSyncStatus,
  triggerSync,
  updateModel,
} from '@/api/openai';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { TablePagination } from '@/components/shared/TablePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AddModelDialog } from '@/pages/models/AddModelDialog';
import { ModelSource, ModelTier, type AIModel } from '@/types/openai';

const LIMIT = 20;

type TabKey = 'all' | 'free' | 'paid';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Models' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

export function ModelsPage() {
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [providerId, setProviderId] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, providerId]);

  const providers = useAsync(getProviders, [refreshKey]);
  const syncStatus = useAsync(getSyncStatus, [refreshKey]);

  const models = useAsync(() => {
    const params = {
      search: debouncedSearch || undefined,
      providerId: providerId || undefined,
      page,
      limit: LIMIT,
    };
    if (tab === 'free') return getFreeModels(params);
    if (tab === 'paid') return getPaidModels(params);
    return getModels(params);
  }, [tab, debouncedSearch, providerId, page, refreshKey]);

  const counts = useAsync(async () => {
    const [all, free, paid] = await Promise.all([
      getModels({ limit: 1 }),
      getFreeModels({ limit: 1 }),
      getPaidModels({ limit: 1 }),
    ]);
    return { all: all.total, free: free.total, paid: paid.total };
  }, [refreshKey]);

  async function handleSync() {
    setIsSyncing(true);
    try {
      const result = await triggerSync();
      toast.success(
        `Synced: ${result.providersCreated} providers created, ${result.modelsCreated} models created, ${result.modelsUpdated} updated`,
      );
      setRefreshKey((k) => k + 1);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleToggleActive(model: AIModel) {
    await updateModel(model.publicId, { isActive: !model.isActive });
    toast.success(model.isActive ? 'Model deactivated' : 'Model activated');
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <PageHeader
        title="Model Registry"
        description="Browse every model synced from OpenRouter, or add your own."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add Custom Model
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="text-sm text-muted-foreground">
            {syncStatus.isLoading ? (
              <Skeleton className="h-5 w-64" />
            ) : (
              <>
                Last synced:{' '}
                <span className="font-medium text-foreground">
                  {syncStatus.data?.lastSyncedAt
                    ? formatRelativeTime(syncStatus.data.lastSyncedAt)
                    : 'never'}
                </span>{' '}
                · <span className="font-medium text-foreground">{syncStatus.data?.modelsCount ?? 0} models</span>{' '}
                from{' '}
                <span className="font-medium text-foreground">
                  {syncStatus.data?.providersCount ?? 0} providers
                </span>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
            Sync Now
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <Badge variant="secondary" className="ml-1">
              {counts.data ? counts.data[t.key] : '—'}
            </Badge>
          </Button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or model ID…"
            className="w-64"
          />
          <Select
            value={providerId || 'all'}
            onValueChange={(v) => setProviderId(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {(providers.data ?? []).map((p) => (
                <SelectItem key={p.publicId} value={p.publicId}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="px-0 pb-0">
          {models.isLoading ? (
            <div className="space-y-2 px-6 pb-6 pt-6">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (models.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={Layers}
              title="No models found"
              description="Try a different search or provider filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Input /1M</TableHead>
                  <TableHead className="text-right">Output /1M</TableHead>
                  <TableHead className="text-right">Context</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.data?.data.map((model) => (
                  <Fragment key={model.publicId}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpanded((prev) => (prev === model.publicId ? null : model.publicId))
                      }
                    >
                      <TableCell>{model.providerName}</TableCell>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {model.modelId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.tier === ModelTier.FREE ? 'success' : 'warning'}>
                          {model.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${model.inputPricePer1M.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${model.outputPricePer1M.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {model.contextWindow ? model.contextWindow.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {model.source === ModelSource.MANUAL ? 'manual' : 'synced'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={model.isActive}
                          onCheckedChange={() => handleToggleActive(model)}
                        />
                      </TableCell>
                    </TableRow>
                    {expanded === model.publicId && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={9} className="whitespace-normal py-4">
                          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Description</div>
                              <div>{model.description || '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Last synced</div>
                              <div>
                                {model.lastSyncedAt ? formatDateTime(model.lastSyncedAt) : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Created / Updated</div>
                              <div>
                                {formatDateTime(model.createdAt)} / {formatDateTime(model.updatedAt)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
          {models.data && (
            <TablePagination
              page={page}
              limit={LIMIT}
              total={models.data.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <AddModelDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        providers={providers.data ?? []}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
