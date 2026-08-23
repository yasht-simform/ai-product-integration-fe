import { useState } from 'react';

import { ModelSelector } from '@/components/shared/ModelSelector';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_FREE_MODEL } from '@/types/openai';
import type { CreateConversationRequest } from '@/types/chat';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateConversationRequest) => void;
  isCreating: boolean;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: NewConversationDialogProps) {
  const [title, setTitle] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_FREE_MODEL);
  const [toolsEnabled, setToolsEnabled] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle('');
      setSystemPrompt('');
      setModel(DEFAULT_FREE_MODEL);
      setToolsEnabled(false);
    }
    onOpenChange(next);
  }

  function handleCreate() {
    onCreate({
      title: title.trim() || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      model,
      toolsEnabled,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Tools can only be enabled at creation time — this can&apos;t be changed later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="conversation-title">Title (optional)</Label>
            <Input
              id="conversation-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-generated from your first message if left blank"
            />
          </div>

          <ModelSelector value={model} onChange={setModel} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="conversation-system-prompt">System Prompt (optional)</Label>
            <Textarea
              id="conversation-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system-level instructions"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="conversation-tools">Enable tools</Label>
              <p className="text-xs text-muted-foreground">
                Lets the model call calculator, weather, and datetime tools.
              </p>
            </div>
            <Switch id="conversation-tools" checked={toolsEnabled} onCheckedChange={setToolsEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
