import { Badge } from '@/components/ui/badge';
import { QA_COMPLEXITY_LABELS, QaComplexity } from '@/types/rag';

export function ComplexityBadge({ complexity }: { complexity: string }) {
  switch (complexity) {
    case QaComplexity.SIMPLE:
      return <Badge variant="success">{QA_COMPLEXITY_LABELS[QaComplexity.SIMPLE]}</Badge>;
    case QaComplexity.MULTI_STEP:
      return <Badge variant="warning">{QA_COMPLEXITY_LABELS[QaComplexity.MULTI_STEP]}</Badge>;
    case QaComplexity.EDGE_CASE:
      return <Badge variant="destructive">{QA_COMPLEXITY_LABELS[QaComplexity.EDGE_CASE]}</Badge>;
    default:
      return <Badge variant="outline">{complexity}</Badge>;
  }
}
