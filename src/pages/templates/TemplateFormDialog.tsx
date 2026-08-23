import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createTemplate, updateTemplate } from '@/api/openai';
import { ModelSelector } from '@/components/shared/ModelSelector';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_FREE_MODEL,
  PROMPT_TECHNIQUE_LABELS,
  PromptTechnique,
  type PromptTemplate,
} from '@/types/openai';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PromptTemplate | null;
  onSaved: () => void;
}

const DEFAULT_FEW_SHOT = '[]';

export function TemplateFormDialog({ open, onOpenChange, template, onSaved }: TemplateFormDialogProps) {
  const isEditing = Boolean(template);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [technique, setTechnique] = useState<PromptTechnique>(PromptTechnique.SYSTEM_PROMPT);
  const [recommendedModel, setRecommendedModel] = useState(DEFAULT_FREE_MODEL);
  const [recommendedTemperature, setRecommendedTemperature] = useState(0.7);
  const [tags, setTags] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fewShotJson, setFewShotJson] = useState(DEFAULT_FEW_SHOT);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      setSystemPrompt(template.systemPrompt);
      setTechnique(template.technique as PromptTechnique);
      setRecommendedModel(template.recommendedModel);
      setRecommendedTemperature(template.recommendedTemperature);
      setTags(template.tags.join(', '));
      setIsActive(template.isActive);
      setFewShotJson(JSON.stringify(template.fewShotExamples ?? [], null, 2));
    } else {
      setName('');
      setDescription('');
      setSystemPrompt('');
      setTechnique(PromptTechnique.SYSTEM_PROMPT);
      setRecommendedModel(DEFAULT_FREE_MODEL);
      setRecommendedTemperature(0.7);
      setTags('');
      setIsActive(true);
      setFewShotJson(DEFAULT_FEW_SHOT);
    }
  }, [open, template]);

  async function handleSubmit() {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error('Name and system prompt are required');
      return;
    }

    let fewShotExamples;
    try {
      fewShotExamples = JSON.parse(fewShotJson);
      if (!Array.isArray(fewShotExamples)) throw new Error('must be an array');
    } catch {
      toast.error('Few-shot examples must be valid JSON — an array of { "input", "output" } objects');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      systemPrompt: systemPrompt.trim(),
      fewShotExamples: fewShotExamples.length > 0 ? fewShotExamples : undefined,
      technique,
      recommendedModel: recommendedModel.trim(),
      recommendedTemperature,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isActive,
    };

    setIsSaving(true);
    try {
      if (isEditing && template) {
        await updateTemplate(template.publicId, payload);
        toast.success('Template updated');
      } else {
        await createTemplate(payload);
        toast.success('Template created');
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            Define a reusable system prompt and its recommended defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. customer-support-triage" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Technique</Label>
              <Select value={technique} onValueChange={(v) => setTechnique(v as PromptTechnique)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PromptTechnique).map((t) => (
                    <SelectItem key={t} value={t}>
                      {PROMPT_TECHNIQUE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>System Prompt</Label>
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModelSelector value={recommendedModel} onChange={setRecommendedModel} label="Recommended Model" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Recommended Temperature</Label>
                <span className="text-sm text-muted-foreground">{recommendedTemperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[recommendedTemperature]}
                onValueChange={([v]) => setRecommendedTemperature(v)}
                min={0}
                max={2}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="support, triage, tier-1" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Few-Shot Examples (JSON array)</Label>
            <Textarea
              value={fewShotJson}
              onChange={(e) => setFewShotJson(e.target.value)}
              rows={5}
              className="font-mono text-xs"
              placeholder='[{ "input": "...", "output": "..." }]'
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Inactive templates are hidden from selection elsewhere.</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
