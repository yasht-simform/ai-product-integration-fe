import { useEffect, useState } from 'react';

import { ModelSelector } from '@/components/shared/ModelSelector';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getToolIcon } from '@/lib/tool-icons';
import type { Conversation, Tool } from '@/types/chat';

interface ConversationSettingsProps {
  conversation: Conversation;
  onUpdateModel: (model: string) => void;
  onUpdateSystemPrompt: (systemPrompt: string) => void;
  temperature: number;
  onTemperatureChange: (value: number) => void;
  maxTokens: number;
  onMaxTokensChange: (value: number) => void;
  tools: Tool[];
  onDeactivateTool: (tool: Tool) => void;
}

export function ConversationSettings({
  conversation,
  onUpdateModel,
  onUpdateSystemPrompt,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  tools,
  onDeactivateTool,
}: ConversationSettingsProps) {
  const [systemPrompt, setSystemPrompt] = useState(conversation.systemPrompt ?? '');

  useEffect(() => {
    setSystemPrompt(conversation.systemPrompt ?? '');
  }, [conversation.publicId, conversation.systemPrompt]);

  return (
    <Card className="flex h-full flex-col overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-base">Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ModelSelector value={conversation.model} onChange={onUpdateModel} />

        <div className="flex flex-col gap-2">
          <Label>System Prompt</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            onBlur={() => {
              if (systemPrompt !== (conversation.systemPrompt ?? '')) onUpdateSystemPrompt(systemPrompt);
            }}
            placeholder="Optional system-level instructions"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={([v]) => onTemperatureChange(v)}
            min={0}
            max={2}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">Applies to your next message only.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="max-tokens">Max Tokens</Label>
          <input
            id="max-tokens"
            type="number"
            min={1}
            max={4096}
            value={maxTokens}
            onChange={(e) => onMaxTokensChange(Number(e.target.value))}
            className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label>Tools</Label>
            <p className="text-xs text-muted-foreground">Fixed at creation — start a new chat to change.</p>
          </div>
          <Switch checked={conversation.toolsEnabled} disabled />
        </div>

        {conversation.toolsEnabled && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Active tools (applies globally)</Label>
            {tools.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tools registered yet.</p>
            ) : (
              tools.map((tool) => {
                const Icon = getToolIcon(tool.name, tool.handlerType);
                return (
                  <div key={tool.publicId} className="flex items-center gap-2 rounded-md border p-2">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{tool.displayName}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {tool.handlerType}
                    </Badge>
                    <Switch
                      checked={tool.isActive}
                      disabled={!tool.isActive}
                      onCheckedChange={(checked) => !checked && onDeactivateTool(tool)}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
