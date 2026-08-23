import { useState } from 'react';
import { Plus, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { createTool, deleteTool, getTools } from '@/api/chat';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAsync } from '@/hooks/useAsync';
import { getToolIcon } from '@/lib/tool-icons';
import { RegisterToolDialog } from '@/pages/tools/RegisterToolDialog';
import { ToolHandlerType, type CreateToolRequest, type Tool } from '@/types/chat';

export function ToolsPage() {
  const { data: tools, isLoading, refetch } = useAsync(getTools, []);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleting, setDeleting] = useState<Tool | null>(null);

  // No "reactivate" endpoint exists on the backend — only a soft-delete (isActive: false) — so
  // this switch can only ever turn a tool off; it's disabled once already inactive.
  async function handleDeactivate(tool: Tool) {
    await deleteTool(tool.publicId);
    toast.success(`${tool.displayName} deactivated`);
    refetch();
  }

  async function handleCreate(payload: CreateToolRequest) {
    setIsCreating(true);
    try {
      await createTool(payload);
      toast.success('Tool registered');
      setIsRegisterOpen(false);
      refetch();
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tools"
        description="Manage the tools available for function calling in chat conversations."
        action={
          <Button onClick={() => setIsRegisterOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Register New Tool
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !tools || tools.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={Wrench} title="No tools registered" description="Register your first tool to get started." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = getToolIcon(tool.name, tool.handlerType);
            const isBuiltin = tool.handlerType === ToolHandlerType.BUILTIN;
            return (
              <Card key={tool.publicId}>
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">{tool.displayName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{tool.name}</p>
                    </div>
                  </div>
                  <Switch
                    checked={tool.isActive}
                    disabled={!tool.isActive}
                    onCheckedChange={(checked) => !checked && handleDeactivate(tool)}
                  />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={isBuiltin ? 'secondary' : 'outline'}>
                        {isBuiltin ? 'Built-in' : 'HTTP'}
                      </Badge>
                      {!tool.isActive && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    {!isBuiltin && (
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleting(tool)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RegisterToolDialog
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        onCreate={handleCreate}
        isCreating={isCreating}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Deactivate tool?"
        description={`"${deleting?.displayName}" will no longer be available to the model.`}
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => deleting && handleDeactivate(deleting)}
      />
    </div>
  );
}
