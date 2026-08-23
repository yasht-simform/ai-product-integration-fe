import { useState } from 'react';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AnalyticsTab } from './AnalyticsTab';
import { BudgetsTab } from './BudgetsTab';
import { TimelineTab } from './TimelineTab';

export function CostPage() {
  const [tab, setTab] = useState('budgets');
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Cost Management"
        description="Per-user spend budgets, cost analytics, and spend-over-time trends."
        action={
          tab === 'budgets' ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Budget
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="timeline">Spend Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets">
          <BudgetsTab dialogOpen={createOpen} onDialogOpenChange={setCreateOpen} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
