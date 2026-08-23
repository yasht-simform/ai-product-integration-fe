import { useState } from 'react';
import { DollarSign } from 'lucide-react';

import { getPricingTable } from '@/api/openai';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/utils';
import { CostCalculator } from '@/pages/pricing/CostCalculator';
import { ModelTier } from '@/types/openai';

export function PricingPage() {
  const [search, setSearch] = useState('');
  const pricingTable = useAsync(getPricingTable, []);

  const query = search.trim().toLowerCase();
  const providers = (pricingTable.data?.providers ?? [])
    .map((group) => ({
      ...group,
      models: query
        ? group.models.filter(
            (m) => m.name.toLowerCase().includes(query) || m.modelId.toLowerCase().includes(query),
          )
        : group.models,
    }))
    .filter((group) => group.models.length > 0);

  return (
    <div>
      <PageHeader
        title="Pricing"
        description="Browse pricing across every synced provider and estimate request cost."
      />

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models by name or ID…"
          className="max-w-sm"
        />
      </div>

      {pricingTable.isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No models found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {providers.map((group) => (
            <Card key={group.slug}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{group.provider}</CardTitle>
                <Badge variant="secondary">{group.models.length} models</Badge>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Input /1M</TableHead>
                      <TableHead className="text-right">Output /1M</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.models.map((model) => (
                      <TableRow
                        key={model.modelId}
                        className={cn(
                          model.tier === ModelTier.FREE && 'bg-emerald-50 dark:bg-emerald-500/10',
                        )}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {model.modelId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {model.tier === ModelTier.FREE
                            ? 'Free'
                            : `$${model.inputPricePer1M.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {model.tier === ModelTier.FREE
                            ? 'Free'
                            : `$${model.outputPricePer1M.toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <CostCalculator />
      </div>
    </div>
  );
}
