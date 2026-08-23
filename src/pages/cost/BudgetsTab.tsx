import { useState } from 'react';
import { AlertTriangle, Pencil, PiggyBank, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteBudget, getBudgetAlerts, getBudgetByUser, getBudgets, updateBudget } from '@/api/cost';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatCost, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Budget, type BudgetStatusResponse, BudgetStatus } from '@/types/cost';

import { BudgetFormDialog } from './BudgetFormDialog';

const PAGE_SIZE = 20;

// Green under 60%, amber 60–80%, red above 80% (design guideline for budget progress bars).
function spendBarColor(percentage: number): string {
  if (percentage > 80) return 'bg-red-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function SpendProgress({ spend, limit, percentage }: { spend: number; limit?: number; percentage: number }) {
  if (limit == null) {
    return (
      <div className="text-xs text-muted-foreground">
        {formatCost(spend)} <span className="opacity-70">/ unlimited</span>
      </div>
    );
  }
  const pct = Math.min(percentage, 100);
  return (
    <div className="flex min-w-36 flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span>{formatCost(spend)}</span>
        <span className={cn('font-medium', percentage > 100 && 'text-red-600 dark:text-red-400')}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', spendBarColor(percentage))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  if (status === BudgetStatus.EXCEEDED) return <Badge variant="destructive">EXCEEDED</Badge>;
  if (status === BudgetStatus.APPROACHING_LIMIT) return <Badge variant="warning">Approaching</Badge>;
  return <Badge variant="success">Within budget</Badge>;
}

export function BudgetsTab({ dialogOpen, onDialogOpenChange }: { dialogOpen: boolean; onDialogOpenChange: (open: boolean) => void }) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const alerts = useAsync(getBudgetAlerts, []);
  const budgets = useAsync(() => getBudgets({ page, limit: PAGE_SIZE }), [page]);

  // Keyed on budgets.data's identity so statuses re-fetch only after a fresh budget list lands —
  // never against a stale row set (a just-deleted budget's status endpoint 404s).
  const statuses = useAsync(async () => {
    const rows = budgets.data?.data ?? [];
    const results = await Promise.all(rows.map((b) => getBudgetByUser(b.userId).catch(() => null)));
    const map: Record<string, BudgetStatusResponse> = {};
    results.forEach((status) => {
      if (status) map[status.userId] = status;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets.data]);

  function refetchAll() {
    budgets.refetch();
    alerts.refetch();
  }

  async function handleToggleActive(budget: Budget, isActive: boolean) {
    try {
      await updateBudget(budget.publicId, { isActive });
      toast.success(`Budget for ${budget.userId} ${isActive ? 'activated' : 'deactivated'}`);
      refetchAll();
    } catch {
      // toast already shown by the API interceptor
    }
  }

  async function handleDelete(budget: Budget) {
    try {
      await deleteBudget(budget.publicId);
      toast.success(`Budget for ${budget.userId} removed`);
      refetchAll();
    } catch {
      // toast already shown by the API interceptor
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {(alerts.data?.length ?? 0) > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10">
          <CardContent className="pb-2 pt-2">
            <Accordion type="single" collapsible defaultValue="alerts">
              <AccordionItem value="alerts" className="border-none">
                <AccordionTrigger className="py-2 text-sm font-medium text-amber-700 hover:no-underline dark:text-amber-400">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    {alerts.data?.length} user{(alerts.data?.length ?? 0) > 1 ? 's' : ''} approaching or over their limit
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {alerts.data?.map((alert) => (
                      <div key={alert.userId} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-background/60 px-3 py-2 text-sm">
                        <span className="font-mono text-xs font-medium">{alert.userId}</span>
                        <Badge variant="warning">{alert.triggeredBy}</Badge>
                        {alert.dailyLimit != null && (
                          <span className="text-xs text-muted-foreground">
                            daily {formatCost(alert.dailySpend)} of {formatCurrency(alert.dailyLimit)} ({Math.round(alert.dailyPercentage)}%)
                          </span>
                        )}
                        {alert.monthlyLimit != null && (
                          <span className="text-xs text-muted-foreground">
                            monthly {formatCost(alert.monthlySpend)} of {formatCurrency(alert.monthlyLimit)} ({Math.round(alert.monthlyPercentage)}%)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="px-0 pb-0">
          {budgets.isLoading ? (
            <div className="space-y-2 px-6 pb-6 pt-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (budgets.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No budgets yet"
              description="Create a budget to enforce daily/monthly spend limits per user."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Daily limit</TableHead>
                    <TableHead>Monthly limit</TableHead>
                    <TableHead>Daily spend</TableHead>
                    <TableHead>Monthly spend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Alert at</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.data?.data.map((budget) => {
                    const status = statuses.data?.[budget.userId];
                    return (
                      <TableRow key={budget.publicId} className={cn(!budget.isActive && 'opacity-60')}>
                        <TableCell className="font-mono text-xs font-medium">{budget.userId}</TableCell>
                        <TableCell>{budget.dailyLimitUsd != null ? formatCurrency(budget.dailyLimitUsd) : '—'}</TableCell>
                        <TableCell>{budget.monthlyLimitUsd != null ? formatCurrency(budget.monthlyLimitUsd) : '—'}</TableCell>
                        <TableCell>
                          {status ? (
                            <SpendProgress spend={status.dailySpend} limit={budget.dailyLimitUsd} percentage={status.dailyPercentage} />
                          ) : (
                            <Skeleton className="h-4 w-24" />
                          )}
                        </TableCell>
                        <TableCell>
                          {status ? (
                            <SpendProgress spend={status.monthlySpend} limit={budget.monthlyLimitUsd} percentage={status.monthlyPercentage} />
                          ) : (
                            <Skeleton className="h-4 w-24" />
                          )}
                        </TableCell>
                        <TableCell>
                          {status ? <BudgetStatusBadge status={status.status} /> : <Skeleton className="h-5 w-20" />}
                        </TableCell>
                        <TableCell className="text-right">{Math.round(budget.alertThreshold * 100)}%</TableCell>
                        <TableCell>
                          <Switch
                            checked={budget.isActive}
                            onCheckedChange={(checked) => handleToggleActive(budget, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(budget)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleting(budget)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination page={page} limit={PAGE_SIZE} total={budgets.data?.total ?? 0} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <BudgetFormDialog open={dialogOpen} onOpenChange={onDialogOpenChange} budget={null} onSaved={refetchAll} />
      <BudgetFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        budget={editing}
        onSaved={refetchAll}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove budget?"
        description={
          deleting
            ? `Spend limits for "${deleting.userId}" will no longer be enforced. This cannot be undone.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  );
}
