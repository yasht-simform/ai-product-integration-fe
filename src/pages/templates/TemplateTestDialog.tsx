import { useEffect, useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';

import { promptTest } from '@/api/openai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCost, formatLatency, formatNumber } from '@/lib/format';
import type { PromptTemplate, PromptTestResponse } from '@/types/openai';

interface TemplateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PromptTemplate;
}

export function TemplateTestDialog({ open, onOpenChange, template }: TemplateTestDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<PromptTestResponse | null>(null);

  useEffect(() => {
    if (open) {
      setPrompt('');
      setResult(null);
    }
  }, [open]);

  async function handleTest() {
    if (!prompt.trim() || isTesting) return;
    setIsTesting(true);
    try {
      const response = await promptTest({
        prompt: prompt.trim(),
        templateName: template.name,
        model: template.recommendedModel,
        temperature: template.recommendedTemperature,
      });
      setResult(response);
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test "{template.name}"</DialogTitle>
          <DialogDescription>
            Sends your prompt with this template's system prompt via{' '}
            <span className="font-mono text-xs">{template.recommendedModel}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Test Prompt</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Enter a message to test this template with…" />
          </div>

          {result && (
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <p className="whitespace-pre-wrap text-sm">{result.content}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{formatNumber(result.usage.totalTokens)} tokens</Badge>
                <Badge variant="outline">{formatCost(result.estimatedCost)}</Badge>
                <Badge variant="outline">{formatLatency(result.latencyMs)}</Badge>
                <Badge variant="outline">
                  sys {formatNumber(result.tokenBreakdown.systemPromptTokens)} / msg{' '}
                  {formatNumber(result.tokenBreakdown.userMessageTokens)} tok
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={!prompt.trim() || isTesting}>
            {isTesting ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
            Run Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
