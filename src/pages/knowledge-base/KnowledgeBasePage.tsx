import { Database, Layers, MessageSquareText, Percent } from 'lucide-react';

import { getRagStats } from '@/api/rag';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAsync } from '@/hooks/useAsync';
import { formatNumber } from '@/lib/format';
import { DocumentsTab } from '@/pages/knowledge-base/DocumentsTab';
import { KnowledgeBaseNav } from '@/pages/knowledge-base/KnowledgeBaseNav';
import { QaTab } from '@/pages/knowledge-base/QaTab';

export function KnowledgeBasePage() {
  const stats = useAsync(getRagStats, []);

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage documents, embeddings, and RAG-powered question answering."
      />

      <KnowledgeBaseNav />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Documents"
          value={formatNumber(stats.data?.totalDocuments ?? 0)}
          icon={Database}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Total Chunks"
          value={formatNumber(stats.data?.totalChunks ?? 0)}
          icon={Layers}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Vectors in Pinecone"
          value={formatNumber(stats.data?.totalVectors ?? 0)}
          icon={MessageSquareText}
          isLoading={stats.isLoading}
          hint={stats.data?.embeddingModel}
        />
        <StatCard
          label="Cache Hit Rate"
          value={`${Math.round((stats.data?.cacheHitRate ?? 0) * 100)}%`}
          icon={Percent}
          isLoading={stats.isLoading}
        />
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="qa">Q&A (RAG)</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>
        <TabsContent value="qa">
          <QaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
