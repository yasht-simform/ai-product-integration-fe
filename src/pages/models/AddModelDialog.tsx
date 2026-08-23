import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createModel } from '@/api/openai';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ModelTier, type Provider } from '@/types/openai';

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: Provider[];
  onCreated: () => void;
}

export function AddModelDialog({ open, onOpenChange, providers, onCreated }: AddModelDialogProps) {
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [tier, setTier] = useState<ModelTier>(ModelTier.PAID);
  const [inputPrice, setInputPrice] = useState('0');
  const [outputPrice, setOutputPrice] = useState('0');
  const [contextWindow, setContextWindow] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setModelId('');
    setProviderId(providers[0]?.publicId ?? '');
    setTier(ModelTier.PAID);
    setInputPrice('0');
    setOutputPrice('0');
    setContextWindow('');
    setDescription('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit() {
    if (!name.trim() || !modelId.trim() || !providerId) {
      toast.error('Name, model ID, and provider are required');
      return;
    }

    setIsSaving(true);
    try {
      await createModel({
        providerId,
        name: name.trim(),
        modelId: modelId.trim(),
        tier,
        inputPricePer1M: Number(inputPrice) || 0,
        outputPricePer1M: Number(outputPrice) || 0,
        contextWindow: contextWindow ? Number(contextWindow) : undefined,
        description: description.trim() || undefined,
      });
      toast.success('Model added');
      onCreated();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Custom Model</DialogTitle>
          <DialogDescription>
            Register a model that isn&apos;t in the OpenRouter catalog, e.g. one only reachable via
            a direct provider API key.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a provider…" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.publicId} value={p.publicId}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Display Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Claude 3.5 Sonnet" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as ModelTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ModelTier.FREE}>Free</SelectItem>
                  <SelectItem value={ModelTier.PAID}>Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Model ID</Label>
            <Input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="e.g. anthropic/claude-3.5-sonnet"
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>Input $/1M</Label>
              <Input type="number" min={0} step="0.01" value={inputPrice} onChange={(e) => setInputPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Output $/1M</Label>
              <Input type="number" min={0} step="0.01" value={outputPrice} onChange={(e) => setOutputPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Context Window</Label>
              <Input type="number" min={1} value={contextWindow} onChange={(e) => setContextWindow(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Add Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
