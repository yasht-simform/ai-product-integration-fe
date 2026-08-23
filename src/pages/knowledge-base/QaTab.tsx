import { useState } from 'react';
import { MessageCircleQuestion, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { createConversation } from '@/api/chat';
import { askInConversation, askQuestion } from '@/api/rag';
import { EmptyState } from '@/components/shared/EmptyState';
import { ModelSelector } from '@/components/shared/ModelSelector';
import { SimilarityBar } from '@/components/shared/SimilarityBar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { formatCost, formatLatency, formatNumber } from '@/lib/format';
import { DEFAULT_FREE_MODEL } from '@/types/openai';
import { DOCUMENT_CATEGORY_LABELS, DocumentCategory, type AskResponse } from '@/types/rag';

interface HistoryEntry {
  id: string;
  question: string;
  response: AskResponse;
}

export function QaTab() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [model, setModel] = useState(DEFAULT_FREE_MODEL);
  const [temperature, setTemperature] = useState(0.3);
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [topK, setTopK] = useState(5);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  const active = history.find((h) => h.id === activeId) ?? null;

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || isAsking) return;

    setIsAsking(true);
    try {
      const response = await askQuestion({
        question: trimmed,
        model,
        temperature,
        topK,
        category: category || undefined,
        includeSourceChunks: true,
      });
      const entry: HistoryEntry = { id: `qa-${Date.now()}`, question: trimmed, response };
      setHistory((prev) => [entry, ...prev]);
      setActiveId(entry.id);
      setQuestion('');
    } finally {
      setIsAsking(false);
    }
  }

  async function handleAskInConversation() {
    const trimmed = question.trim() || active?.question;
    if (!trimmed) {
      toast.error('Ask a question first');
      return;
    }

    setIsStartingConversation(true);
    try {
      const conversation = await createConversation({
        title: trimmed.slice(0, 50),
        model,
        toolsEnabled: false,
      });
      await askInConversation(conversation.publicId, {
        question: trimmed,
        model,
        temperature,
        topK,
        category: category || undefined,
      });
      toast.success('Conversation created');
      navigate(`/chat?c=${conversation.publicId}`);
    } finally {
      setIsStartingConversation(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Question</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="What would you like to know?"
            />
          </div>

          <ModelSelector value={model} onChange={setModel} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
                min={0}
                max={2}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Chunks to retrieve</Label>
                <span className="text-sm text-muted-foreground">{topK}</span>
              </div>
              <Slider
                value={[topK]}
                onValueChange={([v]) => setTopK(v)}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Category filter</Label>
            <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : (v as DocumentCategory))}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.values(DocumentCategory).map((c) => (
                  <SelectItem key={c} value={c}>
                    {DOCUMENT_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAsk} disabled={isAsking || !question.trim()} className="flex-1">
              <Search className="size-4" />
              {isAsking ? 'Asking…' : 'Ask'}
            </Button>
            <Button
              variant="outline"
              onClick={handleAskInConversation}
              disabled={isStartingConversation || (!question.trim() && !active)}
            >
              <Sparkles className="size-4" />
              Ask in Conversation
            </Button>
          </div>

          {history.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">History (this session)</Label>
              <div className="flex max-h-52 flex-col gap-1 overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActiveId(entry.id)}
                    className={`truncate rounded-md px-2.5 py-1.5 text-left text-sm ${
                      entry.id === activeId ? 'bg-accent font-medium' : 'hover:bg-accent/50 text-muted-foreground'
                    }`}
                  >
                    {entry.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Answer</CardTitle>
        </CardHeader>
        <CardContent>
          {isAsking ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : !active ? (
            <EmptyState
              icon={MessageCircleQuestion}
              title="No question asked yet"
              description="Ask a question on the left to get a RAG-powered answer with citations."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{active.response.answer}</p>

              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs sm:grid-cols-5">
                <Metric label="Tokens" value={formatNumber(active.response.usage.totalTokens)} />
                <Metric label="Cost" value={formatCost(active.response.estimatedCost)} />
                <Metric label="Total" value={formatLatency(active.response.latencyMs)} />
                <Metric label="Search" value={formatLatency(active.response.searchLatencyMs)} />
                <Metric label="Generation" value={formatLatency(active.response.generationLatencyMs)} />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">
                  Sources ({active.response.chunksRetrieved})
                </p>
                {active.response.sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No source chunks were retrieved.</p>
                ) : (
                  <Accordion type="multiple" className="rounded-lg border">
                    {active.response.sources.map((source, index) => (
                      <AccordionItem key={`${source.documentPublicId}-${source.chunkIndex}`} value={`source-${index}`}>
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-4 pr-2">
                            <div className="flex flex-col items-start gap-0.5 text-left">
                              <span className="text-sm font-medium">{source.documentTitle}</span>
                              <span className="text-xs text-muted-foreground">Chunk #{source.chunkIndex}</span>
                            </div>
                            <SimilarityBar score={source.similarityScore} />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {source.chunkContent}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
