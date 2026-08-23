import { useState } from 'react';
import { Database, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { generateDocuments, generateQAPairs, seedDefaultDataset, seedRealisticDataset } from '@/api/rag';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DOCUMENT_CATEGORY_LABELS, DocumentCategory } from '@/types/rag';

type Action = 'documents' | 'qa' | 'seed' | 'seed-realistic' | null;

interface GenerateSectionProps {
  onGenerated: () => void;
}

export function GenerateSection({ onGenerated }: GenerateSectionProps) {
  const [docCount, setDocCount] = useState(10);
  const [docCategories, setDocCategories] = useState<DocumentCategory[]>([]);
  const [qaCount, setQaCount] = useState(10);
  const [running, setRunning] = useState<Action>(null);

  function toggleCategory(category: DocumentCategory) {
    setDocCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  }

  async function handleGenerateDocuments() {
    setRunning('documents');
    try {
      const documents = await generateDocuments({
        count: docCount,
        categories: docCategories.length > 0 ? docCategories : undefined,
      });
      toast.success(`Generated ${documents.length} document(s)`);
      onGenerated();
    } finally {
      setRunning(null);
    }
  }

  async function handleGenerateQa() {
    setRunning('qa');
    try {
      const pairs = await generateQAPairs({ count: qaCount });
      toast.success(`Generated ${pairs.length} Q&A pair(s)`);
      onGenerated();
    } finally {
      setRunning(null);
    }
  }

  async function handleSeedDefault() {
    setRunning('seed');
    try {
      const result = await seedDefaultDataset();
      toast.success(`Seeded ${result.documents} documents and ${result.qaPairs} Q&A pairs`);
      onGenerated();
    } finally {
      setRunning(null);
    }
  }

  async function handleSeedRealistic() {
    setRunning('seed-realistic');
    try {
      const result = await seedRealisticDataset();
      toast.success(`Seeded ${result.documents} documents and ${result.qaPairs} Q&A pairs`);
      onGenerated();
    } finally {
      setRunning(null);
    }
  }

  const isBusy = running !== null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Generate Documents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Count</Label>
            <Input
              type="number"
              min={1}
              value={docCount}
              onChange={(e) => setDocCount(Number(e.target.value) || 1)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Categories (default: all, round-robin)</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(DocumentCategory).map((c) => (
                <button key={c} type="button" onClick={() => toggleCategory(c)}>
                  <Badge
                    variant={docCategories.includes(c) ? 'default' : 'outline'}
                    className={cn('cursor-pointer', !docCategories.includes(c) && 'text-muted-foreground')}
                  >
                    {DOCUMENT_CATEGORY_LABELS[c]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleGenerateDocuments} disabled={isBusy} className="self-start">
            {running === 'documents' ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Generate Documents
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Q&amp;A Pairs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Count</Label>
            <Input
              type="number"
              min={1}
              value={qaCount}
              onChange={(e) => setQaCount(Number(e.target.value) || 1)}
              className="w-32"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Draws from all existing documents that already have embedded chunks.
          </p>
          <Button onClick={handleGenerateQa} disabled={isBusy} className="self-start">
            {running === 'qa' ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Generate Q&amp;A Pairs
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seed Default Dataset</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Generates 50 faker-based documents (10 per category) and 500 Q&amp;A pairs in one call.
          </p>
          <Button onClick={handleSeedDefault} disabled={isBusy} variant="secondary" className="self-start">
            {running === 'seed' ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
            Seed Default Dataset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seed Realistic Dataset</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Seeds 10 hand-written, coherent CloudPulse documents with 50 real Q&amp;A pairs — better
            signal for evaluation than faker-generated content.
          </p>
          <Button onClick={handleSeedRealistic} disabled={isBusy} variant="secondary" className="self-start">
            {running === 'seed-realistic' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Seed Realistic Dataset
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
