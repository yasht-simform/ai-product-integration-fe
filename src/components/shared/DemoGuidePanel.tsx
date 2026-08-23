import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Static content mirroring ai-product-integration-be's docs/demo-script.md — a presenter-facing
// checklist, not fetched from anywhere. Each step links to the page it's demoed on.
const GUIDE_STEPS: { title: string; description: string; to: string }[] = [
  {
    title: 'Dashboard',
    description: 'Notice the stat cards showing total API calls, models, and system health.',
    to: '/',
  },
  {
    title: 'Knowledge Base → Documents',
    description: '50 documents loaded across 5 categories.',
    to: '/knowledge-base',
  },
  {
    title: 'Knowledge Base → Q&A',
    description: 'Ask: "What is CloudPulse\'s return policy?" → see the RAG answer with citations.',
    to: '/knowledge-base',
  },
  {
    title: 'Chat',
    description: 'Create a conversation, watch streaming responses word-by-word.',
    to: '/chat',
  },
  {
    title: 'Chat + Tools',
    description: 'Enable tools, ask: "What\'s 15% of 2499?" → see the calculator tool call.',
    to: '/chat',
  },
  {
    title: 'Moderation',
    description: 'Test text in the moderation tester, see category scores.',
    to: '/moderation',
  },
  {
    title: 'Cost Management',
    description: 'View budgets, analytics charts, and projected monthly spend.',
    to: '/cost',
  },
  {
    title: 'Models',
    description: 'Browse 340+ models from 56 providers.',
    to: '/models',
  },
  {
    title: 'Pricing',
    description: 'Compare costs across models with the calculator.',
    to: '/pricing',
  },
  {
    title: 'Glossary',
    description: 'Reference guide for all concepts and tools.',
    to: '/glossary',
  },
];

interface DemoGuidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoGuidePanel({ open, onOpenChange }: DemoGuidePanelProps) {
  // Lives here (not inside SheetContent's own subtree) so progress survives closing and
  // re-opening the panel — it only resets on a full page reload, which is fine for a live demo.
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const completedCount = Object.values(completed).filter(Boolean).length;

  function toggle(index: number) {
    setCompleted((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Demo Walkthrough Guide</SheetTitle>
          <SheetDescription>
            {completedCount}/{GUIDE_STEPS.length} steps checked off — a script for presenting this
            platform live.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ol className="flex flex-col gap-3">
            {GUIDE_STEPS.map((step, index) => (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                    completed[index] && 'bg-muted/50',
                  )}
                >
                  {completed[index] ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        completed[index] && 'text-muted-foreground line-through',
                      )}
                    >
                      {index + 1}. {step.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.description}</span>
                  </span>
                </button>
                <Link
                  to={step.to}
                  onClick={() => onOpenChange(false)}
                  className="ml-11 mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Go to page →
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </SheetContent>
    </Sheet>
  );
}
