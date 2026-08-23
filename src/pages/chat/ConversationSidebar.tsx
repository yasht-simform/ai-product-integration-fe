import { useMemo, useState } from 'react';
import { Archive, MessagesSquare, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { conversationTitle } from '@/pages/chat/utils';
import type { Conversation } from '@/types/chat';

interface ConversationSidebarProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId?: string;
  onSelect: (publicId: string) => void;
  onNewChat: () => void;
  onRename: (publicId: string, title: string) => void;
  onArchive: (publicId: string) => void;
  onDelete: (publicId: string) => void;
}

export function ConversationSidebar({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  onNewChat,
  onRename,
  onArchive,
  onDelete,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [renaming, setRenaming] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<Conversation | null>(null);

  const visible = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return conversations
      .filter((c) => showArchived || !c.isArchived)
      .filter((c) => !lower || conversationTitle(c.title).toLowerCase().includes(lower))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations, query, showArchived]);

  return (
    <div className="hidden h-full w-72 shrink-0 flex-col border-r md:flex">
      <div className="flex flex-col gap-2 border-b p-3">
        <Button onClick={onNewChat} className="w-full gap-2">
          <Plus className="size-4" />
          New Chat
        </Button>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {showArchived ? 'Hide archived' : 'Show archived'}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : visible.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No conversations"
              description={query ? 'No conversations match your search.' : 'Start a new chat to begin.'}
            />
          ) : (
            visible.map((conversation) => (
              <div
                key={conversation.publicId}
                className={cn(
                  'group flex items-center gap-1 rounded-md px-2 py-2 text-left',
                  conversation.publicId === selectedId
                    ? 'bg-primary/10'
                    : 'hover:bg-accent',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.publicId)}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {conversationTitle(conversation.title)}
                    </span>
                    {conversation.isArchived && (
                      <Badge variant="outline" className="text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {conversation.model}
                    </Badge>
                    <span>{formatRelativeTime(conversation.updatedAt)}</span>
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreVertical className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenaming(conversation);
                        setRenameValue(conversationTitle(conversation.title));
                      }}
                    >
                      <Pencil className="size-3.5" />
                      Rename
                    </DropdownMenuItem>
                    {!conversation.isArchived && (
                      <DropdownMenuItem onClick={() => onArchive(conversation.publicId)}>
                        <Archive className="size-3.5" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(conversation)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renaming && renameValue.trim()) {
                onRename(renaming.publicId, renameValue.trim());
                setRenaming(null);
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renaming && renameValue.trim()) {
                  onRename(renaming.publicId, renameValue.trim());
                  setRenaming(null);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete conversation?"
        description={`"${conversationTitle(deleting?.title)}" and all its messages will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleting && onDelete(deleting.publicId)}
      />
    </div>
  );
}
