import { Badge } from '@/components/ui/badge';
import { AiAuditStatus } from '@/types/openai';

const VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline'> = {
  [AiAuditStatus.SUCCESS]: 'success',
  [AiAuditStatus.FAILED]: 'destructive',
  [AiAuditStatus.RETRIED]: 'warning',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT[status] ?? 'outline'}>{status}</Badge>;
}
