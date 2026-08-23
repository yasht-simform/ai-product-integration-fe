import { cn } from '@/lib/utils';

function similarityColor(score: number): string {
  const pct = score * 100;
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function SimilarityBar({ score, className }: { score: number; className?: string }) {
  const pct = Math.round(score * 100);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', similarityColor(score))} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{pct}% match</span>
    </div>
  );
}
