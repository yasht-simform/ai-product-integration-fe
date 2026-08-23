import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

import { getQAPairs } from '@/api/rag';
import { ComplexityBadge } from '@/components/shared/ComplexityBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { QA_COMPLEXITY_LABELS, QaComplexity } from '@/types/rag';

const PAGE_SIZE = 10;

function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

interface QaPairsTableProps {
  documentTitleById: Record<string, string>;
  refreshKey: number;
}

export function QaPairsTable({ documentTitleById, refreshKey }: QaPairsTableProps) {
  const [page, setPage] = useState(1);
  const [complexity, setComplexity] = useState<QaComplexity | ''>('');

  const qaPairs = useAsync(
    () => getQAPairs({ page, limit: PAGE_SIZE, complexity: complexity || undefined }),
    [page, complexity, refreshKey],
  );

  return (
    <Card>
      <CardContent className="px-0 pb-0 pt-6">
        <div className="mb-4 flex items-center justify-between px-6">
          <h3 className="text-sm font-medium">Q&amp;A Pairs</h3>
          <Select
            value={complexity || 'all'}
            onValueChange={(v) => {
              setComplexity(v === 'all' ? '' : (v as QaComplexity));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All complexities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All complexities</SelectItem>
              {Object.values(QaComplexity).map((c) => (
                <SelectItem key={c} value={c}>
                  {QA_COMPLEXITY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {qaPairs.isLoading ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (qaPairs.data?.data.length ?? 0) === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No Q&A pairs yet"
            description="Generate documents and Q&A pairs, or seed a dataset, to populate this table."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Expected Answer</TableHead>
                  <TableHead>Source Document</TableHead>
                  <TableHead>Complexity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qaPairs.data?.data.map((pair) => (
                  <TableRow key={pair.publicId}>
                    <TableCell className="max-w-xs whitespace-normal">{truncate(pair.question)}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                      {truncate(pair.expectedAnswer)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {documentTitleById[pair.sourceDocumentId] ?? truncate(pair.sourceDocumentId, 12)}
                    </TableCell>
                    <TableCell>
                      <ComplexityBadge complexity={pair.complexity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              limit={PAGE_SIZE}
              total={qaPairs.data?.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
