import { useEffect } from 'react';
import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

import { getHealth } from '@/api/openai';
import { Badge } from '@/components/ui/badge';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 30_000;

export function CircuitStatusBadge({ className }: { className?: string }) {
  const { data, refetch } = useAsync(getHealth, []);

  useEffect(() => {
    const interval = setInterval(refetch, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!data) {
    return (
      <Badge variant="outline" className={cn('gap-1.5 text-muted-foreground', className)}>
        <Activity className="size-3" />
        Checking…
      </Badge>
    );
  }

  if (data.circuitState === 'OPEN') {
    return (
      <Badge variant="destructive" className={cn('gap-1.5', className)}>
        <ShieldAlert className="size-3" />
        Circuit Open
      </Badge>
    );
  }

  if (data.circuitState === 'HALF_OPEN') {
    return (
      <Badge variant="warning" className={cn('gap-1.5', className)}>
        <AlertTriangle className="size-3" />
        Recovering
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={cn('gap-1.5', className)}>
      <Activity className="size-3" />
      Operational
    </Badge>
  );
}
