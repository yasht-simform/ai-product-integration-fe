import { useEffect, useRef, useState } from 'react';
import { MessagesSquare, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import {
  archiveConversation,
  createConversation,
  deleteConversation,
  deleteTool,
  getConversation,
  getConversations,
  getTools,
  sendMessage as sendMessageApi,
  updateConversation,
} from '@/api/chat';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsync } from '@/hooks/useAsync';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { ChatInput } from '@/pages/chat/ChatInput';
import { ConversationSettings } from '@/pages/chat/ConversationSettings';
import { ConversationSidebar } from '@/pages/chat/ConversationSidebar';
import { MessageBubble } from '@/pages/chat/MessageBubble';
import { NewConversationDialog } from '@/pages/chat/NewConversationDialog';
import { buildDisplayMessages, conversationTitle } from '@/pages/chat/utils';
import { ChatMessageRole, type ChatMessage, type CreateConversationRequest, type Tool } from '@/types/chat';

const SUGGESTED_PROMPTS = [
  'What is 234 * 567?',
  "What's the weather in Tokyo right now?",
  'What time is it in New York?',
];

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('c') ?? undefined;

  const conversationsState = useAsync(() => getConversations({ limit: 100 }), []);
  const conversationState = useAsync(
    () => (selectedId ? getConversation(selectedId) : Promise.resolve(null)),
    [selectedId],
  );
  const toolsState = useAsync(getTools, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const streamHook = useStreamingChat();

  useEffect(() => {
    setMessages(conversationState.data?.messages ?? []);
    setTemperature(0.7);
    setMaxTokens(1024);
    streamHook.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, conversationState.data]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamHook.streamingContent, streamHook.streamingToolCalls]);

  async function refetchAfterSend(id: string) {
    const fresh = await getConversation(id);
    setMessages(fresh.messages);
    conversationsState.refetch();
  }

  async function handleSend() {
    if (!selectedId) return;
    const content = input.trim();
    if (!content || isSending || streamHook.isStreaming) return;

    setInput('');
    setMessages((prev) => [
      ...prev,
      {
        publicId: `pending-${Date.now()}`,
        role: ChatMessageRole.USER,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);

    if (streamingEnabled) {
      await streamHook.sendMessage(selectedId, { content, temperature, maxTokens });
      await refetchAfterSend(selectedId);
    } else {
      setIsSending(true);
      try {
        await sendMessageApi(selectedId, { content, temperature, maxTokens });
      } catch {
        // apiClient's interceptor already surfaced a toast — still refetch below so the
        // persisted user message (saved before the model call) shows up.
      } finally {
        await refetchAfterSend(selectedId);
        setIsSending(false);
      }
    }
  }

  async function handleCreateConversation(payload: CreateConversationRequest) {
    setIsCreating(true);
    try {
      const conversation = await createConversation(payload);
      await conversationsState.refetch();
      setSearchParams({ c: conversation.publicId });
      setIsNewChatOpen(false);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRename(publicId: string, title: string) {
    await updateConversation(publicId, { title });
    conversationsState.refetch();
    if (publicId === selectedId) conversationState.refetch();
  }

  async function handleArchive(publicId: string) {
    await archiveConversation(publicId);
    toast.success('Conversation archived');
    conversationsState.refetch();
  }

  async function handleDelete(publicId: string) {
    await deleteConversation(publicId);
    toast.success('Conversation deleted');
    conversationsState.refetch();
    if (publicId === selectedId) setSearchParams({});
  }

  async function handleUpdateModel(model: string) {
    if (!selectedId) return;
    await updateConversation(selectedId, { model });
    toast.success('Model updated');
    conversationState.refetch();
    conversationsState.refetch();
  }

  async function handleUpdateSystemPrompt(systemPrompt: string) {
    if (!selectedId) return;
    await updateConversation(selectedId, { systemPrompt });
    toast.success('System prompt updated');
    conversationState.refetch();
  }

  // The tool registry has no "reactivate" endpoint — only a soft-delete (isActive: false) — so
  // this switch can only ever turn an active tool off (the UI disables it once already inactive).
  async function handleDeactivateTool(tool: Tool) {
    await deleteTool(tool.publicId);
    toolsState.refetch();
  }

  const displayMessages = buildDisplayMessages(messages);
  const isStreaming = streamHook.isStreaming;
  if (isStreaming) {
    displayMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamHook.streamingContent,
      isStreaming: true,
      toolCalls: streamHook.streamingToolCalls.map((call) => ({
        id: call.toolCallId,
        name: call.toolName,
        arguments: call.arguments,
      })),
    });
  }

  const conversation = conversationState.data;
  const isBusy = isSending || isStreaming;

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      <ConversationSidebar
        conversations={conversationsState.data?.data ?? []}
        isLoading={conversationsState.isLoading}
        selectedId={selectedId}
        onSelect={(id) => setSearchParams({ c: id })}
        onNewChat={() => setIsNewChatOpen(true)}
        onRename={handleRename}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <EmptyState
              icon={MessagesSquare}
              title="Select or start a conversation"
              description="Pick a conversation from the sidebar, or start a new one."
            />
            <Button onClick={() => setIsNewChatOpen(true)} className="gap-2">
              <Plus className="size-4" />
              New Chat
            </Button>
          </div>
        ) : conversationState.isLoading ? (
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="ml-auto h-16 w-1/2" />
            <Skeleton className="h-16 w-2/3" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="truncate text-sm font-semibold">{conversationTitle(conversation?.title)}</h2>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="flex flex-col gap-5 py-4">
                {displayMessages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
                    <MessagesSquare className="size-8" />
                    <p className="font-medium text-foreground">Start a conversation</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setInput(prompt)}
                          className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  displayMessages.map((message) => <MessageBubble key={message.id} message={message} />)
                )}
                <div ref={scrollEndRef} />
              </div>
            </ScrollArea>

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isBusy}
              isStreaming={isStreaming}
              streamingEnabled={streamingEnabled}
              onStreamingEnabledChange={setStreamingEnabled}
              onCancel={streamHook.cancel}
            />
          </>
        )}
      </div>

      {conversation && (
        <div className="hidden w-80 shrink-0 xl:block">
          <ConversationSettings
            conversation={conversation}
            onUpdateModel={handleUpdateModel}
            onUpdateSystemPrompt={handleUpdateSystemPrompt}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            tools={toolsState.data ?? []}
            onDeactivateTool={handleDeactivateTool}
          />
        </div>
      )}

      <NewConversationDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        onCreate={handleCreateConversation}
        isCreating={isCreating}
      />
    </div>
  );
}
