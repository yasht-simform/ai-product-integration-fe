import { Bot, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatCost, formatLatency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ToolCallCard } from '@/pages/chat/ToolCallCard';
import type { DisplayMessage } from '@/pages/chat/types';

export function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user';
  const hasText = Boolean(message.content && message.content.length > 0);

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={cn('flex max-w-[75%] flex-col gap-1.5', isUser && 'items-end')}>
        {message.toolCalls?.map((call) => (
          <ToolCallCard key={call.id} name={call.name} args={call.arguments} result={call.result} />
        ))}

        {(hasText || message.isStreaming) && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
              isUser
                ? 'rounded-tr-sm bg-primary text-primary-foreground'
                : message.isError
                  ? 'rounded-tl-sm bg-destructive/10 text-destructive'
                  : 'rounded-tl-sm border bg-card',
            )}
          >
            {message.content}
            {message.isStreaming && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle" />
            )}
          </div>
        )}

        {!isUser && !message.isError && !message.isStreaming && message.tokenCount !== undefined && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            {message.model && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {message.model}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatNumber(message.tokenCount)} tokens
              {message.estimatedCost !== undefined && ` · ${formatCost(message.estimatedCost)}`}
              {message.latencyMs !== undefined && ` · ${formatLatency(message.latencyMs)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
