import { useState } from 'react';
import { Pencil, Plus, PlayCircle, ScrollText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteTemplate, listTemplates } from '@/api/openai';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { TablePagination } from '@/components/shared/TablePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { TemplateFormDialog } from '@/pages/templates/TemplateFormDialog';
import { TemplateTestDialog } from '@/pages/templates/TemplateTestDialog';
import { PROMPT_TECHNIQUE_LABELS, type PromptTechnique, type PromptTemplate } from '@/types/openai';

const PAGE_SIZE = 10;

export function TemplatesPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [testingTemplate, setTestingTemplate] = useState<PromptTemplate | null>(null);

  const templates = useAsync(() => listTemplates({ page, limit: PAGE_SIZE }), [page]);

  function openCreate() {
    setEditingTemplate(null);
    setFormOpen(true);
  }

  function openEdit(template: PromptTemplate) {
    setEditingTemplate(template);
    setFormOpen(true);
  }

  async function handleDelete(template: PromptTemplate) {
    if (!window.confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    await deleteTemplate(template.publicId);
    toast.success('Template deleted');
    templates.refetch();
  }

  return (
    <div>
      <PageHeader
        title="Prompt Templates"
        description="Reusable system prompts with recommended model and temperature defaults."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New Template
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 pb-0">
          {templates.isLoading ? (
            <div className="space-y-2 px-6 pb-6 pt-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (templates.data?.data.length ?? 0) === 0 ? (
            <EmptyState icon={ScrollText} title="No templates yet" description="Create your first prompt template to get started." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Technique</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.data?.data.map((template) => (
                    <TableRow key={template.publicId}>
                      <TableCell>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PROMPT_TECHNIQUE_LABELS[template.technique as PromptTechnique] ?? template.technique}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{template.recommendedModel}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'success' : 'outline'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Test" onClick={() => setTestingTemplate(template)}>
                            <PlayCircle className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(template)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(template)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination page={page} limit={PAGE_SIZE} total={templates.data?.total ?? 0} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
        onSaved={() => templates.refetch()}
      />

      {testingTemplate && (
        <TemplateTestDialog
          open={Boolean(testingTemplate)}
          onOpenChange={(open) => !open && setTestingTemplate(null)}
          template={testingTemplate}
        />
      )}
    </div>
  );
}
