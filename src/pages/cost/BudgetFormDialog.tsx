import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createBudget, updateBudget } from '@/api/cost';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Budget } from '@/types/cost';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null; // null = create
  onSaved: () => void;
}

export function BudgetFormDialog({ open, onOpenChange, budget, onSaved }: BudgetFormDialogProps) {
  const [userId, setUserId] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUserId(budget?.userId ?? '');
    setDailyLimit(budget?.dailyLimitUsd != null ? String(budget.dailyLimitUsd) : '');
    setMonthlyLimit(budget?.monthlyLimitUsd != null ? String(budget.monthlyLimitUsd) : '');
    setAlertThreshold(budget?.alertThreshold ?? 0.8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit() {
    if (!budget && !userId.trim()) {
      toast.error('User ID is required');
      return;
    }
    const daily = dailyLimit.trim() === '' ? undefined : Number(dailyLimit);
    const monthly = monthlyLimit.trim() === '' ? undefined : Number(monthlyLimit);
    if ((daily !== undefined && (Number.isNaN(daily) || daily < 0)) || (monthly !== undefined && (Number.isNaN(monthly) || monthly < 0))) {
      toast.error('Limits must be non-negative numbers');
      return;
    }

    setIsSaving(true);
    try {
      if (budget) {
        await updateBudget(budget.publicId, {
          dailyLimitUsd: daily,
          monthlyLimitUsd: monthly,
          alertThreshold,
        });
        toast.success(`Budget for ${budget.userId} updated`);
      } else {
        await createBudget({
          userId: userId.trim(),
          dailyLimitUsd: daily,
          monthlyLimitUsd: monthly,
          alertThreshold,
        });
        toast.success(`Budget for ${userId.trim()} created`);
      }
      onSaved();
      onOpenChange(false);
    } catch {
      // toast already shown by the API interceptor (e.g. 409 duplicate userId)
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
          <DialogDescription>
            {budget
              ? `Update spend limits for ${budget.userId}. Empty limit = unchanged.`
              : 'Set daily/monthly spend limits for a user. Leave a limit empty for unlimited.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>User ID</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. demo-user"
              disabled={!!budget}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Daily limit ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Monthly limit ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Alert threshold</Label>
              <span className="text-sm font-medium">{Math.round(alertThreshold * 100)}%</span>
            </div>
            <Slider
              value={[alertThreshold]}
              onValueChange={([value]) => setAlertThreshold(value)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              A warning is raised once spend crosses this fraction of a limit.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {budget ? 'Save Changes' : 'Create Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
