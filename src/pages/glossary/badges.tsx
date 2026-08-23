import { CheckCircle2, Circle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { GlossaryStatus, ParamUsage, PricingKind } from '@/pages/glossary/types';

const STATUS_CONFIG: Record<
  GlossaryStatus,
  { label: string; variant: 'success' | 'warning' | 'secondary'; icon: typeof CheckCircle2 }
> = {
  implemented: { label: 'Implemented', variant: 'success', icon: CheckCircle2 },
  planned: { label: 'Planned', variant: 'warning', icon: Clock },
  'not-started': { label: 'Not Started', variant: 'secondary', icon: Circle },
};

export function GlossaryStatusBadge({ status }: { status: GlossaryStatus }) {
  const { label, variant, icon: Icon } = STATUS_CONFIG[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}

const PRICING_CONFIG: Record<PricingKind, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  free: { label: 'Free', variant: 'success' },
  freemium: { label: 'Freemium', variant: 'warning' },
  paid: { label: 'Paid', variant: 'default' },
};

export function PricingBadge({ pricing }: { pricing: PricingKind }) {
  const { label, variant } = PRICING_CONFIG[pricing];
  return <Badge variant={variant}>{label}</Badge>;
}

const PARAM_USAGE_CONFIG: Record<ParamUsage, { label: string; variant: 'success' | 'secondary' }> = {
  used: { label: 'We Use This', variant: 'success' },
  available: { label: 'Available', variant: 'secondary' },
};

export function ParamUsageBadge({ usage }: { usage: ParamUsage }) {
  const { label, variant } = PARAM_USAGE_CONFIG[usage];
  return <Badge variant={variant}>{label}</Badge>;
}
