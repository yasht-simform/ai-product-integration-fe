import { useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { checkModeration, checkModerationBatch } from '@/api/moderation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { ModerationResult } from '@/types/moderation';

import { CategoryScoreGrid } from './CategoryScoreGrid';
import { FlaggedBadge } from './shared';

export function ModerationTesterTab({ onChecked }: { onChecked: () => void }) {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);

  const [batchText, setBatchText] = useState('');
  const [isBatchChecking, setIsBatchChecking] = useState(false);
  const [batchResults, setBatchResults] = useState<{ text: string; result: ModerationResult }[] | null>(null);

  async function handleCheck() {
    if (!text.trim()) {
      toast.error('Enter some text to check');
      return;
    }
    setIsChecking(true);
    try {
      const res = await checkModeration({ text });
      setResult(res);
      toast[res.isFlagged ? 'warning' : 'success'](
        res.isFlagged
          ? `Flagged: ${res.flaggedCategories.join(', ') || 'policy violation'}`
          : 'Text is safe',
      );
      onChecked();
    } catch {
      // toast already shown by the API interceptor
    } finally {
      setIsChecking(false);
    }
  }

  async function handleBatchCheck() {
    const texts = batchText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (texts.length === 0) {
      toast.error('Enter at least one line of text');
      return;
    }
    if (texts.length > 50) {
      toast.error('Batch checks are limited to 50 texts');
      return;
    }
    setIsBatchChecking(true);
    try {
      const results = await checkModerationBatch({ texts });
      setBatchResults(texts.map((t, i) => ({ text: t, result: results[i] })));
      const flagged = results.filter((r) => r.isFlagged).length;
      toast[flagged > 0 ? 'warning' : 'success'](
        flagged > 0 ? `${flagged} of ${results.length} texts flagged` : `All ${results.length} texts are safe`,
      );
      onChecked();
    } catch {
      // toast already shown by the API interceptor
    } finally {
      setIsBatchChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Check Text</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text to check against OpenAI's moderation categories…"
            rows={4}
          />
          <div>
            <Button onClick={handleCheck} disabled={isChecking}>
              {isChecking ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
              Check
            </Button>
          </div>

          {result && (
            <div className="flex flex-col gap-4 border-t pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <FlaggedBadge isFlagged={result.isFlagged} className="px-3 py-1 text-sm" />
                {result.highestScore.category && (
                  <span className="text-sm text-muted-foreground">
                    Highest: <span className="font-medium text-foreground">{result.highestScore.category}</span>{' '}
                    ({result.highestScore.score.toFixed(3)})
                  </span>
                )}
              </div>
              <CategoryScoreGrid categories={result.categories} categoryScores={result.categoryScores} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check Batch</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={'One text per line, up to 50 lines…'}
            rows={5}
          />
          <div>
            <Button variant="outline" onClick={handleBatchCheck} disabled={isBatchChecking}>
              {isBatchChecking && <Loader2 className="size-4 animate-spin" />}
              Check Batch
            </Button>
          </div>

          {batchResults && (
            <div className="flex flex-col gap-2 border-t pt-4">
              {batchResults.map(({ text: itemText, result: itemResult }, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                  <FlaggedBadge isFlagged={itemResult.isFlagged} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{itemText}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {itemResult.isFlagged && itemResult.flaggedCategories.length > 0
                        ? `Flagged: ${itemResult.flaggedCategories.join(', ')}`
                        : itemResult.highestScore.category
                          ? `Highest: ${itemResult.highestScore.category} (${itemResult.highestScore.score.toFixed(3)})`
                          : 'No category scores'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
