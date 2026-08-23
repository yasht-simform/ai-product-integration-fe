import { useState } from 'react';
import { FileText, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { deleteDocument, getDocuments, reindexDocument } from '@/api/rag';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AddTextDocumentDialog } from '@/pages/knowledge-base/AddTextDocumentDialog';
import { DocumentRow } from '@/pages/knowledge-base/DocumentRow';
import { UploadDocumentDialog } from '@/pages/knowledge-base/UploadDocumentDialog';
import {
  DOCUMENT_CATEGORY_LABELS,
  DocumentCategory,
  EmbeddingStatus,
  type Document,
} from '@/types/rag';

const PAGE_SIZE = 10;
const EMBEDDING_STATUS_LABELS: Record<string, string> = {
  [EmbeddingStatus.PENDING]: 'Pending',
  [EmbeddingStatus.PROCESSING]: 'Processing',
  [EmbeddingStatus.COMPLETED]: 'Completed',
  [EmbeddingStatus.FAILED]: 'Failed',
};

export function DocumentsTab() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [status, setStatus] = useState<EmbeddingStatus | ''>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddTextOpen, setIsAddTextOpen] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Document | null>(null);

  const documents = useAsync(
    () =>
      getDocuments({
        page,
        limit: PAGE_SIZE,
        category: category || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
      }),
    [page, category, status, debouncedSearch],
  );

  async function handleReindex(document: Document) {
    setReindexingId(document.publicId);
    try {
      await reindexDocument(document.publicId);
      toast.success(`Reindexing "${document.title}" started`);
      documents.refetch();
    } finally {
      setReindexingId(null);
    }
  }

  async function handleDelete(document: Document) {
    await deleteDocument(document.publicId);
    toast.success('Document deleted');
    documents.refetch();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title…"
            className="w-56"
          />
          <Select
            value={category || 'all'}
            onValueChange={(v) => {
              setCategory(v === 'all' ? '' : (v as DocumentCategory));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.values(DocumentCategory).map((c) => (
                <SelectItem key={c} value={c}>
                  {DOCUMENT_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || 'all'}
            onValueChange={(v) => {
              setStatus(v === 'all' ? '' : (v as EmbeddingStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(EmbeddingStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {EMBEDDING_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddTextOpen(true)}>
            <Plus className="size-4" />
            Add from Text
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="size-4" />
            Upload
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0 pb-0">
          {documents.isLoading ? (
            <div className="space-y-2 px-6 pb-6 pt-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (documents.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload a file or add raw text to build your knowledge base."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.data?.data.map((document) => (
                    <DocumentRow
                      key={document.publicId}
                      document={document}
                      onReindex={handleReindex}
                      onDelete={setDeleting}
                      isReindexing={reindexingId === document.publicId}
                    />
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                limit={PAGE_SIZE}
                total={documents.data?.total ?? 0}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploaded={() => documents.refetch()}
      />
      <AddTextDocumentDialog
        open={isAddTextOpen}
        onOpenChange={setIsAddTextOpen}
        onCreated={() => documents.refetch()}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete document?"
        description={`"${deleting?.title}" and all of its chunks and vectors will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  );
}
