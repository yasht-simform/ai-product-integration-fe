import { AlertTriangle, Percent, ShieldAlert, ShieldCheck } from 'lucide-react';

import { getModerationStats } from '@/api/moderation';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAsync } from '@/hooks/useAsync';
import { formatNumber } from '@/lib/format';

import { ModerationLogsTab } from './ModerationLogsTab';
import { ModerationTesterTab } from './ModerationTesterTab';

export function ModerationPage() {
  const stats = useAsync(() => getModerationStats(), []);

  const topCategory = stats.data?.topCategories[0];
  const violationRate = stats.data?.violationRate ?? 0;

  return (
    <div>
      <PageHeader
        title="Content Moderation"
        description="Check text against OpenAI's moderation categories and monitor every check made through chat and RAG."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Checks"
          value={formatNumber(stats.data?.totalChecks ?? 0)}
          icon={ShieldCheck}
          isLoading={stats.isLoading}
          hint={
            stats.data
              ? `${formatNumber(stats.data.byDirection.input)} input · ${formatNumber(stats.data.byDirection.output)} output`
              : undefined
          }
        />
        <StatCard
          label="Flagged"
          value={formatNumber(stats.data?.flaggedCount ?? 0)}
          icon={ShieldAlert}
          isLoading={stats.isLoading}
          iconClassName={
            (stats.data?.flaggedCount ?? 0) > 0 ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : undefined
          }
        />
        <StatCard
          label="Violation Rate"
          value={`${(violationRate * 100).toFixed(1)}%`}
          icon={Percent}
          isLoading={stats.isLoading}
          iconClassName={
            violationRate >= 0.1
              ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
              : violationRate > 0
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                : undefined
          }
        />
        <StatCard
          label="Top Category"
          value={topCategory?.category ?? '—'}
          icon={AlertTriangle}
          isLoading={stats.isLoading}
          hint={topCategory ? `${formatNumber(topCategory.count)} flags` : 'No flagged content yet'}
          iconClassName={topCategory ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' : undefined}
        />
      </div>

      <Tabs defaultValue="tester">
        <TabsList>
          <TabsTrigger value="tester">Moderation Tester</TabsTrigger>
          <TabsTrigger value="logs">Moderation Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="tester">
          <ModerationTesterTab onChecked={stats.refetch} />
        </TabsContent>
        <TabsContent value="logs">
          <ModerationLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
