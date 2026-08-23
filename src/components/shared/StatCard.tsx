import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, iconClassName, isLoading, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">{label}</span>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <span className="text-2xl font-semibold tracking-tight">{value}</span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary', iconClassName)}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
