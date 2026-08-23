import { type ChangeEvent, type KeyboardEvent } from 'react';
import { Send, Square, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isStreaming: boolean;
  streamingEnabled: boolean;
  onStreamingEnabledChange: (enabled: boolean) => void;
  onCancel: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  isStreaming,
  streamingEnabled,
  onStreamingEnabledChange,
  onCancel,
}: ChatInputProps) {
  function autoGrow(e: ChangeEvent<HTMLTextAreaElement>) {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    onChange(e.target.value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={autoGrow}
          onKeyDown={handleKeyDown}
          placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
          className="min-h-11 flex-1 resize-none overflow-y-auto"
          rows={1}
          disabled={disabled}
        />
        {isStreaming ? (
          <Button type="button" variant="outline" size="icon" onClick={onCancel}>
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="button" size="icon" disabled={disabled || !value.trim()} onClick={onSend}>
            <Send className="size-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Zap className="size-3.5 text-muted-foreground" />
        <Label htmlFor="streaming-toggle" className="text-xs text-muted-foreground">
          Stream response
        </Label>
        <Switch
          id="streaming-toggle"
          checked={streamingEnabled}
          onCheckedChange={onStreamingEnabledChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
