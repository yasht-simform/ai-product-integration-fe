import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { ALL_CATEGORIES, scoreBarColor } from './shared';

interface CategoryScoreGridProps {
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  className?: string;
}

export function CategoryScoreGrid({ categories, categoryScores, className }: CategoryScoreGridProps) {
  // Include any category the API returned that isn't in the static list (future-proofing).
  const extras = Object.keys(categoryScores).filter((c) => !ALL_CATEGORIES.includes(c));
  const list = [...ALL_CATEGORIES, ...extras];

  return (
    <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {list.map((category) => {
        const score = categoryScores[category] ?? 0;
        const isFlagged = categories[category] ?? false;
        return (
          <div
            key={category}
            className={cn(
              'flex flex-col gap-2 rounded-lg border p-3',
              isFlagged ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10' : 'bg-muted/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'truncate text-xs font-medium',
                  isFlagged ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground',
                )}
              >
                {category}
              </span>
              {isFlagged ? (
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                  flagged
                </Badge>
              ) : (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
                  clean
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', scoreBarColor(score))}
                  style={{ width: `${Math.max(score * 100, score > 0 ? 2 : 0)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                {score.toFixed(3)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
