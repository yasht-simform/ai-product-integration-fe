import { useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { uploadDocument } from '@/api/rag';
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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DOCUMENT_CATEGORY_LABELS, DocumentCategory } from '@/types/rag';

const ACCEPTED_EXTENSIONS = '.pdf,.txt,.md';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

export function UploadDocumentDialog({ open, onOpenChange, onUploaded }: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function reset() {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setTags('');
    setProgress(0);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isUploading) reset();
    onOpenChange(next);
  }

  async function handleUpload() {
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (title.trim()) formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (category) formData.append('category', category);
    if (tags.trim()) formData.append('tags', tags.trim());

    setIsUploading(true);
    setProgress(0);
    try {
      await uploadDocument(formData, setProgress);
      toast.success('Document uploaded — ingestion started');
      onUploaded();
      handleOpenChange(false);
      reset();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            PDF, TXT, or MD files are chunked and embedded automatically after upload.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-file">File</Label>
            <label
              htmlFor="doc-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-accent"
            >
              <UploadCloud className="size-6 text-muted-foreground" />
              <span className="text-sm">
                {file ? file.name : 'Click to choose a PDF, TXT, or MD file'}
              </span>
              {file && <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>}
              <input
                id="doc-file"
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Title (optional — defaults to filename)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={category || undefined} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentCategory).map((c) => (
                    <SelectItem key={c} value={c}>
                      {DOCUMENT_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="onboarding, api" />
            </div>
          </div>

          {isUploading && (
            <div className="flex flex-col gap-1.5">
              <Progress value={progress} />
              <span className="text-xs text-muted-foreground">Uploading… {progress}%</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading && <Loader2 className="size-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
