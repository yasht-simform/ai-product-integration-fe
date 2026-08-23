import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/knowledge-base', label: 'Documents & Q&A', end: true },
  { to: '/knowledge-base/evaluation', label: 'Mock Data & Evaluation', end: false },
];

// Sits at the top of both KnowledgeBasePage and EvaluationPage so the two halves of this
// feature (built as separate routes, not nested tabs, so evaluation gets its own URL) read as
// one cohesive section.
export function KnowledgeBaseNav() {
  return (
    <div className="mb-4 flex gap-1 border-b">
      {NAV_ITEMS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'border-b-2 px-3 pb-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  );
}
