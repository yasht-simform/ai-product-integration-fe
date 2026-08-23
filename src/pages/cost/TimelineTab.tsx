import { useState } from 'react';
import { LineChart as LineChartIcon, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getDailyTrend } from '@/api/cost';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

const PERIODS = [7, 14, 30, 90];

export function TimelineTab() {
  const [days, setDays] = useState(30);

  // Fetch 2× the window so the trend arrow can compare against the immediately preceding period.
  const trend = useAsync(() => getDailyTrend(days * 2), [days]);

  const allPoints = trend.data?.data ?? [];
  const current = allPoints.slice(-days);
  const previous = allPoints.slice(0, Math.max(allPoints.length - days, 0));

  const currentTotal = current.reduce((sum, p) => sum + p.totalCost, 0);
  const previousTotal = previous.reduce((sum, p) => sum + p.totalCost, 0);
  const delta = currentTotal - previousTotal;
  const deltaPct = previousTotal > 0 ? (delta / previousTotal) * 100 : null;

  const hasSpend = current.some((p) => p.totalCost > 0 || p.callCount > 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Spend</CardTitle>
          <CardAction className="flex flex-wrap items-center gap-3">
            {!trend.isLoading && (
              <Badge variant={delta > 0 ? 'warning' : 'success'} className="gap-1">
                {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {formatCost(Math.abs(delta))}
                {deltaPct !== null && ` (${delta >= 0 ? '+' : '−'}${Math.abs(deltaPct).toFixed(0)}%)`} vs previous {days}d
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {PERIODS.map((p) => (
                <Button
                  key={p}
                  variant={days === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(p)}
                >
                  {p}d
                </Button>
              ))}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {trend.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !hasSpend ? (
            <EmptyState
              icon={LineChartIcon}
              title="No spend in this period"
              description="Daily buckets appear once API calls accumulate cost."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={current} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Cost' ? formatCost(Number(value)) : formatNumber(Number(value))
                  }
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalCost"
                  name="Cost"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#spendFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {trend.isLoading ? (
            <div className="space-y-2 px-6 pb-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...current].reverse().map((point) => (
                  <TableRow key={point.date} className={cn(point.callCount === 0 && 'text-muted-foreground')}>
                    <TableCell>{point.date}</TableCell>
                    <TableCell className="text-right">{formatCost(point.totalCost)}</TableCell>
                    <TableCell className="text-right">{formatNumber(point.callCount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(point.totalTokens)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
