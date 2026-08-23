import { Activity, BookText, DollarSign, Gauge, Layers, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router';

import { getBudgetAlerts, getBudgets, getProjectedSpend } from '@/api/cost';
import { getModerationStats } from '@/api/moderation';
import { getAuditLogs, getCostSummary, getFreeModels, getSyncStatus } from '@/api/openai';
import { getRagStats } from '@/api/rag';
import { CircuitStatusBadge } from '@/components/shared/CircuitStatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAsync } from '@/hooks/useAsync';
import { formatCost, formatCurrency, formatDateTime, formatLatency, formatNumber } from '@/lib/format';
import { DemoControlsCard } from '@/pages/dashboard/DemoControlsCard';

export function DashboardPage() {
  const costSummary = useAsync(() => getCostSummary({}), []);
  const recentLogs = useAsync(() => getAuditLogs({ page: 1, limit: 10 }), []);
  const syncStatus = useAsync(getSyncStatus, []);
  const freeModels = useAsync(() => getFreeModels({ limit: 1 }), []);
  const ragStats = useAsync(getRagStats, []);
  const moderationStats = useAsync(() => getModerationStats(), []);
  const activeBudgets = useAsync(() => getBudgets({ isActive: true, limit: 1 }), []);
  const budgetAlerts = useAsync(getBudgetAlerts, []);
  const projectedSpend = useAsync(getProjectedSpend, []);

  const chartData = (costSummary.data?.perModelBreakdown ?? []).map((row) => ({
    model: row.model,
    cost: Number(row.cost.toFixed(4)),
    callCount: row.callCount,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of OpenAI usage, cost, and system health."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total API Calls"
          value={formatNumber(costSummary.data?.callCount ?? 0)}
          icon={Activity}
          isLoading={costSummary.isLoading}
        />
        <StatCard
          label="Total Cost"
          value={formatCurrency(costSummary.data?.totalCost ?? 0)}
          icon={DollarSign}
          isLoading={costSummary.isLoading}
        />
        <StatCard
          label="Average Latency"
          value={formatLatency(costSummary.data?.averageLatencyMs ?? 0)}
          icon={Gauge}
          isLoading={costSummary.isLoading}
        />
        <StatCard
          label="Active Models"
          value={formatNumber(syncStatus.data?.modelsCount ?? 0)}
          icon={Layers}
          isLoading={syncStatus.isLoading}
          hint={
            syncStatus.data
              ? `${formatNumber(syncStatus.data.providersCount)} providers · ${formatNumber(freeModels.data?.total ?? 0)} free`
              : undefined
          }
        />
        <StatCard
          label="Knowledge Base"
          value={`${formatNumber(ragStats.data?.totalDocuments ?? 0)} docs`}
          icon={BookText}
          isLoading={ragStats.isLoading}
          hint={
            ragStats.data
              ? `${formatNumber(ragStats.data.totalChunks)} chunks · ${formatNumber(ragStats.data.totalVectors)} vectors`
              : undefined
          }
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Safety &amp; Governance</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Content Moderation"
            value={`${((moderationStats.data?.violationRate ?? 0) * 100).toFixed(1)}%`}
            icon={ShieldCheck}
            isLoading={moderationStats.isLoading}
            hint={
              moderationStats.data
                ? `violation rate · ${formatNumber(moderationStats.data.totalChecks)} checks, ${formatNumber(moderationStats.data.flaggedCount)} flagged`
                : undefined
            }
            iconClassName={
              (moderationStats.data?.violationRate ?? 0) > 0
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                : undefined
            }
          />
          <StatCard
            label="Active Budgets"
            value={formatNumber(activeBudgets.data?.total ?? 0)}
            icon={Wallet}
            isLoading={activeBudgets.isLoading}
            hint={
              budgetAlerts.data
                ? `${formatNumber(budgetAlerts.data.length)} user${budgetAlerts.data.length === 1 ? '' : 's'} at warning or exceeded`
                : undefined
            }
            iconClassName={
              (budgetAlerts.data?.length ?? 0) > 0
                ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                : undefined
            }
          />
          <StatCard
            label="Projected Monthly Spend"
            value={formatCost(projectedSpend.data?.projected ?? 0)}
            icon={TrendingUp}
            isLoading={projectedSpend.isLoading}
            hint={
              projectedSpend.data
                ? `${formatCost(projectedSpend.data.monthToDate)} month to date · day ${projectedSpend.data.daysElapsed} of ${projectedSpend.data.daysInMonth}`
                : undefined
            }
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {costSummary.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState icon={DollarSign} title="No usage yet" description="Cost breakdown appears once you make API calls." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="model" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value) => formatCost(Number(value))}
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="cost" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Circuit breaker</span>
              <CircuitStatusBadge />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Input tokens</span>
              <span className="text-sm font-medium">{formatNumber(costSummary.data?.totalInputTokens ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Output tokens</span>
              <span className="text-sm font-medium">{formatNumber(costSummary.data?.totalOutputTokens ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total tokens</span>
              <span className="text-sm font-medium">{formatNumber(costSummary.data?.totalTokens ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent API Calls</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/audit-logs">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recentLogs.isLoading ? (
            <div className="space-y-2 px-6 pb-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (recentLogs.data?.data.length ?? 0) === 0 ? (
            <EmptyState icon={Activity} title="No API calls yet" description="Try the Chat Playground to generate your first call." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.data?.data.map((log) => (
                  <TableRow key={log.publicId}>
                    <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{log.model}</TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(log.totalTokens)}</TableCell>
                    <TableCell className="text-right">{formatCost(log.estimatedCost)}</TableCell>
                    <TableCell className="text-right">{formatLatency(log.latencyMs)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DemoControlsCard />
    </div>
  );
}
