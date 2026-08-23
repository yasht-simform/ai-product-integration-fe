import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ModerationAction, ModerationCategory, ModerationDirection } from '@/types/moderation';

// All 11 categories in a stable display order — results/logs may only carry a subset of keys,
// so grids iterate this list rather than whatever keys the payload happens to have.
export const ALL_CATEGORIES: string[] = Object.values(ModerationCategory);

// 0–0.3 green, 0.3–0.7 amber, 0.7+ red (design guideline for category score bars).
export function scoreBarColor(score: number): string {
  if (score >= 0.7) return 'bg-red-500';
  if (score >= 0.3) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function FlaggedBadge({ isFlagged, className }: { isFlagged: boolean; className?: string }) {
  return isFlagged ? (
    <Badge variant="destructive" className={className}>
      FLAGGED
    </Badge>
  ) : (
    <Badge variant="success" className={className}>
      SAFE
    </Badge>
  );
}

export function DirectionBadge({ direction }: { direction: string }) {
  return (
    <Badge variant={direction === ModerationDirection.OUTPUT ? 'secondary' : 'outline'}>
      {direction}
    </Badge>
  );
}

const ACTION_STYLES: Record<string, string> = {
  [ModerationAction.ALLOWED]:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  [ModerationAction.BLOCKED]: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  [ModerationAction.REPLACED]:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

export function ActionBadge({ action }: { action: string }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent', ACTION_STYLES[action])}>
      {action}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return <Badge variant="outline">{source}</Badge>;
}
