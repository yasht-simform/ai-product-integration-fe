import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Route, Routes } from 'react-router';

import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { AuditLogsPage } from '@/pages/audit-logs/AuditLogsPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { ComparePage } from '@/pages/compare/ComparePage';
import { CostPage } from '@/pages/cost/CostPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ModerationPage } from '@/pages/moderation/ModerationPage';
import { RetentionPage } from '@/pages/retention/RetentionPage';
import { GlossaryPage } from '@/pages/glossary/GlossaryPage';
import { EvaluationPage } from '@/pages/knowledge-base/evaluation/EvaluationPage';
import { KnowledgeBasePage } from '@/pages/knowledge-base/KnowledgeBasePage';
import { ModelsPage } from '@/pages/models/ModelsPage';
import { PricingPage } from '@/pages/pricing/PricingPage';
import { TemplatesPage } from '@/pages/templates/TemplatesPage';
import { TokensPage } from '@/pages/tokens/TokensPage';
import { ToolsPage } from '@/pages/tools/ToolsPage';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="knowledge-base/evaluation" element={<EvaluationPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="tokens" element={<TokensPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="moderation" element={<ModerationPage />} />
            <Route path="cost" element={<CostPage />} />
            <Route path="retention" element={<RetentionPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="glossary" element={<GlossaryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors duration={3000} />
    </ThemeProvider>
  );
}

export default App;
