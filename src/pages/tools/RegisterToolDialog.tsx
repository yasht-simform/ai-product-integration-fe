import { useMemo, useState } from 'react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToolHandlerType, type CreateToolRequest } from '@/types/chat';

const DEFAULT_PARAMETERS = `{
  "type": "object",
  "properties": {},
  "required": []
}`;

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

type JsonObjectResult = { ok: true; value: Record<string, unknown> } | { ok: false; error: string };

function parseJsonObject(text: string, shapeError: string): JsonObjectResult {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: shapeError };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
}

interface RegisterToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateToolRequest) => void;
  isCreating: boolean;
}

export function RegisterToolDialog({ open, onOpenChange, onCreate, isCreating }: RegisterToolDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('POST');
  const [headersText, setHeadersText] = useState('{}');
  const [parametersText, setParametersText] = useState(DEFAULT_PARAMETERS);

  const parametersResult = useMemo(() => parseJsonObject(parametersText, 'Must be a JSON object (JSON Schema)'), [parametersText]);
  const headersResult = useMemo(() => parseJsonObject(headersText || '{}', 'Must be a JSON object'), [headersText]);

  const isValid =
    name.trim() && displayName.trim() && description.trim() && url.trim() && parametersResult.ok && headersResult.ok;

  function reset() {
    setName('');
    setDisplayName('');
    setDescription('');
    setUrl('');
    setMethod('POST');
    setHeadersText('{}');
    setParametersText(DEFAULT_PARAMETERS);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleCreate() {
    if (!isValid || !parametersResult.ok || !headersResult.ok) return;
    onCreate({
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim(),
      parameters: parametersResult.value,
      handlerType: ToolHandlerType.HTTP,
      handlerConfig: { url: url.trim(), method, headers: headersResult.value },
    });
  }

  const preview = {
    type: 'function',
    function: {
      name: name.trim() || '(name)',
      description: description.trim() || '(description)',
      parameters: parametersResult.ok ? parametersResult.value : {},
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register new tool</DialogTitle>
          <DialogDescription>
            HTTP tools call an external endpoint when the model invokes them. The allowed domains
            are controlled server-side via CHAT_TOOL_HTTP_ALLOWED_DOMAINS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tool-name">Name (slug)</Label>
              <Input
                id="tool-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="get_stock_price"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tool-display-name">Display Name</Label>
              <Input
                id="tool-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Get Stock Price"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tool-description">Description</Label>
              <Textarea
                id="tool-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shown to the model to decide when to call this tool"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tool-url">URL</Label>
                <Input
                  id="tool-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/lookup"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tool-headers">Headers (JSON)</Label>
              <Textarea
                id="tool-headers"
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                rows={2}
                className="font-mono text-xs"
              />
              {!headersResult.ok && <p className="text-xs text-destructive">{headersResult.error}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tool-parameters">Parameters (JSON Schema)</Label>
              <Textarea
                id="tool-parameters"
                value={parametersText}
                onChange={(e) => setParametersText(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              {!parametersResult.ok && <p className="text-xs text-destructive">{parametersResult.error}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Preview — as sent to the model</Label>
            <pre className="h-full overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || isCreating}>
            Register Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
