import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useSearchMatch(search: string) {
  const debounced = useDebouncedValue(search, 200);
  const query = debounced.trim().toLowerCase();
  return (...fields: string[]) => !query || fields.some((field) => field.toLowerCase().includes(query));
}

export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs font-normal text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function Field({
  label,
  muted,
  children,
}: {
  label: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={muted ? 'mt-1 text-muted-foreground' : 'mt-1'}>{children}</p>
    </div>
  );
}

export function NoMatches() {
  return <p className="py-8 text-center text-sm text-muted-foreground">No matches in this section.</p>;
}
