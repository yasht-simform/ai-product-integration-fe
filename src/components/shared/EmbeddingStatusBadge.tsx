import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { EmbeddingStatus } from '@/types/rag';

export function EmbeddingStatusBadge({ status }: { status: string }) {
  switch (status) {
    case EmbeddingStatus.COMPLETED:
      return <Badge variant="success">Completed</Badge>;
    case EmbeddingStatus.FAILED:
      return <Badge variant="destructive">Failed</Badge>;
    case EmbeddingStatus.PROCESSING:
      return (
        <Badge className="border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
          <Loader2 className="size-3 animate-spin" />
          Processing
        </Badge>
      );
    case EmbeddingStatus.PENDING:
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}
