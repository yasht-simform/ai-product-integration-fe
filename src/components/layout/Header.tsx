import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router';

import { CircuitStatusBadge } from '@/components/shared/CircuitStatusBadge';
import { DemoGuidePanel } from '@/components/shared/DemoGuidePanel';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/chat': 'Chat',
  '/tools': 'Tools',
  '/compare': 'Model Comparison',
  '/templates': 'Prompt Templates',
  '/tokens': 'Token Calculator',
  '/audit-logs': 'Audit Logs',
  '/glossary': 'Glossary',
};

export function Header() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'AI Product Integration';
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold md:hidden">{title}</h2>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}>
          <HelpCircle className="size-4" />
          Guide
        </Button>
        <CircuitStatusBadge />
        <ThemeToggle />
      </div>
      <DemoGuidePanel open={guideOpen} onOpenChange={setGuideOpen} />
    </header>
  );
}
