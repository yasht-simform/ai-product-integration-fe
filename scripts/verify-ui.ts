/**
 * One-time UI smoke check against a running FE (http://localhost:5173) and BE
 * (http://localhost:3000). Not a test suite — run with: npx tsx scripts/verify-ui.ts
 *
 * For every page: navigate, wait for loading to finish (no skeletons), assert
 * page-specific content, capture console errors, and save a full-page screenshot
 * to screenshots/<page-name>.png. Failures are logged but never stop the run.
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium, type Page } from '@playwright/test';

const FE_URL = 'http://localhost:5173';
const BE_URL = 'http://localhost:3000/api/v1';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
const SMOKE_TITLE = `UI Smoke Test ${Date.now()}`;
// Pin the chat model explicitly (now also the FE/BE default) — the previous default,
// meta-llama/llama-3.3-70b-instruct:free, returned empty content in a prior run.
const CHAT_MODEL = 'tencent/hy3:free';

interface PageResult {
  name: string;
  route: string;
  ok: boolean;
  notes: string[];
  errors: string[];
}

const results: PageResult[] = [];
let consoleErrors: string[] = [];

const IGNORED_CONSOLE = [/Download the React DevTools/i, /favicon/i];

function shouldIgnore(text: string): boolean {
  return IGNORED_CONSOLE.some((re) => re.test(text));
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForFunction(
    () => document.querySelectorAll('[data-slot="skeleton"]').length === 0,
    undefined,
    { timeout: 30_000 },
  );
}

async function beGet(pathname: string): Promise<any> {
  const res = await fetch(`${BE_URL}${pathname}`);
  if (!res.ok) throw new Error(`GET ${pathname} -> ${res.status}`);
  const body = await res.json();
  return body.data; // response envelope { success, data, timestamp }
}

async function checkPage(
  name: string,
  route: string,
  page: Page,
  assertions: (page: Page, notes: string[]) => Promise<void>,
): Promise<void> {
  consoleErrors = [];
  const notes: string[] = [];
  let ok = true;
  const errors: string[] = [];

  try {
    await page.goto(`${FE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await settle(page);
    await assertions(page, notes);
  } catch (error) {
    ok = false;
    errors.push(error instanceof Error ? error.message.split('\n')[0] : String(error));
  }

  if (consoleErrors.length > 0) {
    ok = false;
    errors.push(...consoleErrors.map((e) => `console: ${e}`));
  }

  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    notes.push(`screenshot: screenshots/${name}.png`);
  } catch (error) {
    notes.push(`screenshot failed: ${error instanceof Error ? error.message.split('\n')[0] : error}`);
  }

  results.push({ name, route, ok, notes, errors });
  if (ok) {
    console.log(`✅ ${route} — loaded, no errors${notes.length ? ` (${notes.filter((n) => !n.startsWith('screenshot')).join('; ')})` : ''}`);
  } else {
    console.log(`❌ ${route} — error: ${errors.join(' | ')}`);
  }
}

async function expectText(page: Page, text: string | RegExp): Promise<void> {
  const locator = page.getByText(text).first();
  await locator.waitFor({ state: 'visible', timeout: 15_000 });
}

async function main(): Promise<void> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !shouldIgnore(msg.text())) consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(`pageerror: ${error.message.slice(0, 300)}`);
  });

  // ─── / (Dashboard) ───
  await checkPage('dashboard', '/', page, async (p, notes) => {
    await expectText(p, 'Dashboard');
    const statCards = await p.locator('[data-slot="card"]').count();
    if (statCards === 0) throw new Error('no stat cards rendered');
    notes.push(`${statCards} cards rendered`);
  });

  // ─── /chat — sidebar, create conversation, send message, get response ───
  await checkPage('chat', '/chat', page, async (p, notes) => {
    // Two "New Chat" buttons exist (sidebar + empty state) — either works.
    const newChat = p.getByRole('button', { name: 'New Chat' }).first();
    await newChat.waitFor({ state: 'visible', timeout: 15_000 });
    notes.push('sidebar loaded');

    await newChat.click();
    await expectText(p, 'New conversation');
    await p.locator('#conversation-title').fill(SMOKE_TITLE);
    // Pick a reliable model via the searchable model combobox.
    await p.getByRole('combobox').click();
    await p.getByPlaceholder(/Search models/).fill(CHAT_MODEL);
    await p
      .locator(`button:has-text("${CHAT_MODEL}")`)
      .last()
      .click({ timeout: 15_000 });
    await p.getByRole('button', { name: 'Create', exact: true }).click();
    await p.getByText(SMOKE_TITLE).first().waitFor({ state: 'visible', timeout: 15_000 });
    notes.push('conversation created');

    const input = p.getByPlaceholder(/Send a message/);
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.fill('Reply with the single word: pong');
    await input.press('Enter');

    // Wait for an assistant bubble (normal or error variant) to appear…
    await p
      .locator('div.whitespace-pre-wrap.bg-card, div.whitespace-pre-wrap.text-destructive')
      .first()
      .waitFor({ state: 'visible', timeout: 120_000 });
    // …then for streaming to finish (blinking cursor removed).
    await p.waitForFunction(
      () => document.querySelectorAll('.whitespace-pre-wrap .animate-pulse').length === 0,
      undefined,
      { timeout: 120_000 },
    );

    const errorBubble = p.locator('div.whitespace-pre-wrap.text-destructive');
    if ((await errorBubble.count()) > 0) {
      throw new Error(`assistant returned an error bubble: ${(await errorBubble.first().innerText()).slice(0, 200)}`);
    }
    // The content bubble unmounts when the model streams zero content, so check
    // count() first instead of blocking on innerText.
    const bubbles = p.locator('div.whitespace-pre-wrap.bg-card');
    if ((await bubbles.count()) === 0) {
      throw new Error('stream completed but assistant content is empty (flaky free-tier model?)');
    }
    const reply = (await bubbles.last().innerText()).trim();
    if (reply.length === 0) throw new Error('assistant reply is empty');
    notes.push(`assistant replied: "${reply.slice(0, 60)}"`);
  });

  // ─── /compare ───
  await checkPage('compare', '/compare', page, async (p, notes) => {
    await expectText(p, 'Model Comparison');
    const textareas = await p.locator('textarea').count();
    if (textareas === 0) throw new Error('comparison form (prompt textarea) not found');
    notes.push('comparison form rendered');
  });

  // ─── /templates ───
  await checkPage('templates', '/templates', page, async (p, notes) => {
    await expectText(p, 'Prompt Templates');
    const rows = await p.locator('table tbody tr').count();
    if (rows === 0) throw new Error('template table has no rows (seed data missing?)');
    notes.push(`${rows} template rows`);
  });

  // ─── /tokens ───
  await checkPage('tokens', '/tokens', page, async (p, notes) => {
    await expectText(p, 'Token Calculator');
    const textareas = await p.locator('textarea').count();
    if (textareas === 0) throw new Error('token calculator form (textarea) not found');
    notes.push('calculator form rendered');
  });

  // ─── /models ───
  await checkPage('models', '/models', page, async (p, notes) => {
    await expectText(p, 'Model Registry');
    const rows = await p.locator('table tbody tr').count();
    if (rows === 0) throw new Error('model table has no rows');
    const modelsPage = await beGet('/openai/models?limit=1');
    const total: number = modelsPage.total;
    if (total < 340) throw new Error(`expected 340+ models in registry, backend reports ${total}`);
    notes.push(`${rows} rows visible, ${total} models total`);
  });

  // ─── /pricing — table + cost calculator ───
  await checkPage('pricing', '/pricing', page, async (p, notes) => {
    await expectText(p, 'Pricing');
    await expectText(p, 'Cost Calculator');
    await p.getByRole('button', { name: '1K tokens' }).click();
    await p.waitForFunction(
      () => !document.body.innerText.includes('Calculating…'),
      undefined,
      { timeout: 20_000 },
    );
    // Default model is a free-tier model, so a completed calculation renders this.
    await expectText(p, /Free — \$0\.00|Total/);
    notes.push('cost calculator produced a result');
  });

  // ─── /tools ───
  await checkPage('tools', '/tools', page, async (p, notes) => {
    await expectText(p, 'Tools');
    for (const tool of ['calculator', 'weather', 'datetime']) {
      await expectText(p, tool);
    }
    notes.push('3 built-in tools visible');
  });

  // ─── /knowledge-base — Documents tab + Q&A tab ───
  await checkPage('knowledge-base', '/knowledge-base', page, async (p, notes) => {
    await expectText(p, 'Knowledge Base');
    await p.getByRole('tab', { name: 'Documents' }).waitFor({ state: 'visible', timeout: 15_000 });
    notes.push('Documents tab loaded');
    await p.getByRole('tab', { name: 'Q&A (RAG)' }).click();
    await p.getByRole('tabpanel').waitFor({ state: 'visible', timeout: 15_000 });
    await settle(p);
    notes.push('Q&A tab loaded');
  });

  // ─── /knowledge-base/evaluation ───
  await checkPage('knowledge-base-evaluation', '/knowledge-base/evaluation', page, async (p, notes) => {
    await expectText(p, 'Mock Data & Evaluation');
    notes.push('evaluation page rendered');
  });

  // ─── /audit-logs ───
  await checkPage('audit-logs', '/audit-logs', page, async (p, notes) => {
    await expectText(p, 'Audit Logs');
    const rows = await p.locator('table tbody tr').count();
    const empty = await p.getByText('No audit logs found').count();
    if (rows === 0 && empty === 0) throw new Error('neither audit rows nor empty state rendered');
    notes.push(rows > 0 ? `${rows} audit rows` : 'empty state (no logs yet)');
  });

  // ─── /moderation — stats cards, tester tab, logs tab ───
  await checkPage('moderation', '/moderation', page, async (p, notes) => {
    await expectText(p, 'Content Moderation');
    const statCards = await p.locator('[data-slot="card"]').count();
    if (statCards === 0) throw new Error('no stat cards rendered');
    notes.push(`${statCards} cards rendered`);

    await p.getByRole('tab', { name: 'Moderation Tester' }).waitFor({ state: 'visible', timeout: 15_000 });
    const textarea = p.getByPlaceholder(/Paste text to check/);
    await textarea.waitFor({ state: 'visible', timeout: 15_000 });
    const checkButton = p.getByRole('button', { name: 'Check', exact: true });
    if ((await checkButton.count()) === 0) throw new Error('Check button not found on tester tab');
    notes.push('tester tab loaded (textarea + Check button)');

    await p.getByRole('tab', { name: 'Moderation Logs' }).click();
    await p.getByRole('tabpanel').waitFor({ state: 'visible', timeout: 15_000 });
    await settle(p);
    const rows = await p.locator('table tbody tr').count();
    const empty = await p.getByText('No moderation logs found').count();
    if (rows === 0 && empty === 0) throw new Error('neither log rows nor empty state rendered on logs tab');
    notes.push(rows > 0 ? `logs tab loaded (${rows} rows)` : 'logs tab loaded (empty state)');
  });

  // ─── /cost — budgets tab, analytics tab, spend timeline tab ───
  await checkPage('cost', '/cost', page, async (p, notes) => {
    await expectText(p, 'Cost Management');
    await p.getByRole('tab', { name: 'Budgets' }).waitFor({ state: 'visible', timeout: 15_000 });
    const budgetTable = await p.locator('table tbody tr').count();
    const budgetEmpty = await p.getByText('No budgets yet').count();
    if (budgetTable === 0 && budgetEmpty === 0) throw new Error('neither budget rows nor empty state rendered');
    notes.push(budgetTable > 0 ? `budgets tab loaded (${budgetTable} rows)` : 'budgets tab loaded (empty state)');

    await p.getByRole('tab', { name: 'Analytics' }).click();
    await p.getByRole('tabpanel').waitFor({ state: 'visible', timeout: 15_000 });
    await settle(p);
    await expectText(p, 'Projected monthly spend');
    await expectText(p, 'Spend by User');
    const charts = await p.locator('.recharts-responsive-container').count();
    if (charts === 0) throw new Error('no charts/cards rendered on analytics tab');
    notes.push(`analytics tab loaded (${charts} charts)`);

    await p.getByRole('tab', { name: 'Spend Timeline' }).click();
    await p.getByRole('tabpanel').waitFor({ state: 'visible', timeout: 15_000 });
    await settle(p);
    await expectText(p, 'Daily Spend');
    const timelineChart = await p.locator('.recharts-responsive-container').count();
    if (timelineChart === 0) {
      const emptyChart = await p.getByText('No spend in this period').count();
      if (emptyChart === 0) throw new Error('spend timeline chart not rendered (no chart, no empty state)');
      notes.push('spend timeline tab loaded (empty state)');
    } else {
      notes.push('spend timeline tab loaded (chart rendered)');
    }
  });

  // ─── /retention — config section, cleanup status, Run Cleanup Now button ───
  await checkPage('retention', '/retention', page, async (p, notes) => {
    await expectText(p, 'Data Retention');
    await expectText(p, 'Retention Periods');
    for (const label of ['Audit Logs', 'Moderation Logs', 'Archived Conversations', 'Embedding Cache']) {
      await expectText(p, label);
    }
    notes.push('retention periods rendered');

    await expectText(p, 'Cleanup Status');
    await expectText(p, 'Last cleanup');
    const runCleanupButton = p.getByRole('button', { name: 'Run Cleanup Now' });
    await runCleanupButton.waitFor({ state: 'visible', timeout: 15_000 });
    notes.push('cleanup status loaded, Run Cleanup Now button visible');
  });

  // ─── /glossary ───
  await checkPage('glossary', '/glossary', page, async (p, notes) => {
    await expectText(p, 'Glossary & Learning Reference');
    for (const section of [
      'Concepts & Learning Areas',
      'Tools & Libraries',
      'Key Practices',
      'Practice Apps from Goal Document',
    ]) {
      await expectText(p, section);
    }
    notes.push('all 4 sections rendered');
  });

  await browser.close();

  // Cleanup: delete the smoke-test conversation created above.
  try {
    const conversations = await beGet('/chat/conversations?limit=100');
    const created = (conversations.data as Array<{ publicId: string; title?: string }>).find(
      (c) => c.title === SMOKE_TITLE,
    );
    if (created) {
      await fetch(`${BE_URL}/chat/conversations/${created.publicId}`, { method: 'DELETE' });
      console.log(`🧹 cleaned up smoke-test conversation ${created.publicId}`);
    }
  } catch (error) {
    console.log(`⚠️  cleanup failed (non-fatal): ${error instanceof Error ? error.message : error}`);
  }

  // ─── Summary ───
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  console.log('\n══════════ SUMMARY ══════════');
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.route.padEnd(28)} ${r.ok ? 'pass' : r.errors.join(' | ')}`);
  }
  console.log(`─────────────────────────────`);
  console.log(`${passed.length}/${results.length} pages passed${failed.length ? `, ${failed.length} failed` : ''}`);
  const totalConsoleErrors = results.reduce((sum, r) => sum + r.errors.filter((e) => e.startsWith('console: ') || e.startsWith('pageerror: ')).length, 0);
  console.log(
    `\nAI Product Integration — All ${results.length} pages verified, ${totalConsoleErrors} console errors`,
  );
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exitCode = 1;
});
