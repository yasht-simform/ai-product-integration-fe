import { useState } from 'react';
import { ArrowDown, ArrowUp, DollarSign, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getProjectedSpend, getSpendByFeature, getSpendByModel, getSpendByUser } from '@/api/cost';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCost, formatNumber } from '@/lib/format';

const CHART_TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
} as const;

// Fixed hue per feature (identity), never assigned by rank — extra features fold onto chart-4/5.
const FEATURE_COLORS: Record<string, string> = {
  chat: 'var(--chart-1)',
  embeddings: 'var(--chart-2)',
  moderations: 'var(--chart-3)',
};
const FALLBACK_COLORS = ['var(--chart-4)', 'var(--chart-5)'];

export function AnalyticsTab() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const range = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const byUser = useAsync(
    () => getSpendByUser({ ...range, sortOrder, limit: 20 }),
    [startDate, endDate, sortOrder],
  );
  const byModel = useAsync(() => getSpendByModel(range), [startDate, endDate]);
  const byFeature = useAsync(() => getSpendByFeature(range), [startDate, endDate]);
  const projected = useAsync(getProjectedSpend, []);

  const userRows = byUser.data?.data ?? [];
  const modelRows = (byModel.data?.data ?? []).slice(0, 10);
  const featureRows = byFeature.data?.data ?? [];
  const featureTotal = featureRows.reduce((sum, row) => sum + row.totalCost, 0);

  // Precomputed so the chart cells and the legend always agree on an unknown feature's color.
  const colorByFeature = new Map<string, string>();
  let fallbackIndex = 0;
  for (const row of featureRows) {
    colorByFeature.set(
      row.feature,
      FEATURE_COLORS[row.feature] ?? FALLBACK_COLORS[fallbackIndex++ % FALLBACK_COLORS.length],
    );
  }
  const featureColor = (feature: string) => colorByFeature.get(feature) ?? 'var(--chart-5)';

  const daysRemaining = (projected.data?.daysInMonth ?? 0) - (projected.data?.daysElapsed ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label>From</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>To</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            Filters the by-user, by-model, and by-feature sections. Projected spend always covers the current month.
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Projected monthly spend</div>
              {projected.isLoading ? (
                <Skeleton className="mt-1 h-9 w-32" />
              ) : (
                <div className="text-3xl font-semibold tracking-tight">
                  {formatCost(projected.data?.projected ?? 0)}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-muted-foreground">Month to date</div>
              <div className="font-medium">{formatCost(projected.data?.monthToDate ?? 0)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Daily average</div>
              <div className="font-medium">{formatCost(projected.data?.dailyAverage ?? 0)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Days elapsed</div>
              <div className="font-medium">{projected.data?.daysElapsed ?? 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Days remaining</div>
              <div className="font-medium">{daysRemaining}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend by User</CardTitle>
          </CardHeader>
          <CardContent>
            {byUser.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : userRows.length === 0 ? (
              <EmptyState icon={DollarSign} title="No spend in this range" />
            ) : (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={userRows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="userId" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip formatter={(value) => formatCost(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="totalCost" name="Total cost" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={64} />
                  </BarChart>
                </ResponsiveContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right"
                        onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                      >
                        <span className="inline-flex items-center gap-1">
                          Total cost
                          {sortOrder === 'desc' ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
                        </span>
                      </TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Avg cost / call</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRows.map((row) => (
                      <TableRow key={row.userId}>
                        <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                        <TableCell className="text-right">{formatCost(row.totalCost)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.callCount)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.totalTokens)}</TableCell>
                        <TableCell className="text-right">
                          {formatCost(row.callCount > 0 ? row.totalCost / row.callCount : 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {byModel.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : modelRows.length === 0 ? (
              <EmptyState icon={DollarSign} title="No spend in this range" />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, modelRows.length * 36)}>
                <BarChart data={modelRows} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="model"
                    width={180}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => formatCost(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="totalCost" name="Total cost" fill="var(--chart-2)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend by Feature</CardTitle>
          </CardHeader>
          <CardContent>
            {byFeature.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : featureRows.length === 0 || featureTotal === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No spend in this range"
                description="Moderation and embedding calls are free-tier here, so this often stays chat-only."
              />
            ) : (
              <div className="flex flex-wrap items-center gap-6">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={featureRows}
                      dataKey="totalCost"
                      nameKey="feature"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="var(--card)"
                    >
                      {featureRows.map((row) => (
                        <Cell key={row.feature} fill={featureColor(row.feature)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCost(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex min-w-44 flex-1 flex-col gap-2">
                  {featureRows.map((row) => (
                    <div key={row.feature} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: featureColor(row.feature) }} />
                        {row.feature}
                        <span className="text-xs text-muted-foreground">({formatNumber(row.callCount)} calls)</span>
                      </span>
                      <span className="font-medium">
                        {formatCost(row.totalCost)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {featureTotal > 0 ? `${Math.round((row.totalCost / featureTotal) * 100)}%` : ''}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
