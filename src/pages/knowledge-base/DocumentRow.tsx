import { useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';

import { getDocumentChunks } from '@/api/rag';
import { EmbeddingStatusBadge } from '@/components/shared/EmbeddingStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { useAsync } from '@/hooks/useAsync';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DOCUMENT_CATEGORY_LABELS, type Document } from '@/types/rag';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  txt: 'TXT',
  md: 'MD',
  generated: 'Generated',
};

const CHUNK_PREVIEW_LIMIT = 5;

interface DocumentRowProps {
  document: Document;
  onReindex: (document: Document) => void;
  onDelete: (document: Document) => void;
  isReindexing: boolean;
}

export function DocumentRow({ document, onReindex, onDelete, isReindexing }: DocumentRowProps) {
  const [expanded, setExpanded] = useState(false);

  const chunks = useAsync(
    () =>
      expanded
        ? getDocumentChunks(document.publicId, { limit: CHUNK_PREVIEW_LIMIT })
        : Promise.resolve(null),
    [expanded, document.publicId],
  );

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <TableCell className="w-8">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </TableCell>
        <TableCell>
          <div className="font-medium">{document.title}</div>
          {document.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </TableCell>
        <TableCell>
          {document.category ? (
            <Badge variant="secondary">
              {DOCUMENT_CATEGORY_LABELS[document.category as keyof typeof DOCUMENT_CATEGORY_LABELS] ??
                document.category}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline">{SOURCE_TYPE_LABELS[document.sourceType] ?? document.sourceType}</Badge>
        </TableCell>
        <TableCell>{document.totalChunks}</TableCell>
        <TableCell>{document.totalTokens.toLocaleString()}</TableCell>
        <TableCell>
          <EmbeddingStatusBadge status={document.embeddingStatus} />
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDate(document.createdAt)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Reindex"
              disabled={isReindexing}
              onClick={() => onReindex(document)}
            >
              <RefreshCw className={cn('size-4', isReindexing && 'animate-spin')} />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={() => onDelete(document)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30">
            {chunks.isLoading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !chunks.data || chunks.data.data.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No chunks yet.</p>
            ) : (
              <div className="flex flex-col gap-2 py-2">
                {chunks.data.data.map((chunk) => (
                  <div key={chunk.publicId} className="rounded-md border bg-background p-2.5 text-xs">
                    <div className="mb-1 flex items-center justify-between text-muted-foreground">
                      <span>Chunk #{chunk.chunkIndex}</span>
                      <span>{chunk.tokenCount} tokens</span>
                    </div>
                    <p className="line-clamp-2 text-foreground">{chunk.content}</p>
                  </div>
                ))}
                {chunks.data.total > CHUNK_PREVIEW_LIMIT && (
                  <p className="text-xs text-muted-foreground">
                    Showing {CHUNK_PREVIEW_LIMIT} of {chunks.data.total} chunks.
                  </p>
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
