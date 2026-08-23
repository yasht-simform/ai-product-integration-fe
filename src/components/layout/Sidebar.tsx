import {
  BookOpen,
  BookText,
  Calculator,
  Clock,
  DollarSign,
  History,
  LayoutDashboard,
  Layers,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  Wallet,
  Wrench,
} from 'lucide-react';
import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: BookText },
  { to: '/compare', label: 'Model Comparison', icon: SplitSquareHorizontal },
  { to: '/templates', label: 'Prompt Templates', icon: ScrollText },
  { to: '/tokens', label: 'Token Calculator', icon: Calculator },
  { to: '/models', label: 'Models', icon: Layers },
  { to: '/pricing', label: 'Pricing', icon: DollarSign },
  { to: '/moderation', label: 'Moderation', icon: ShieldCheck },
  { to: '/cost', label: 'Cost Management', icon: Wallet },
  { to: '/retention', label: 'Data Retention', icon: Clock },
  { to: '/audit-logs', label: 'Audit Logs', icon: History },
  { to: '/glossary', label: 'Glossary', icon: BookOpen },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">AI Product Integration</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        Learning project — NestJS + OpenAI
      </div>
    </aside>
  );
}
