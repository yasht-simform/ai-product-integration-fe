# AI Product Integration — Frontend Claude Context

## Project Purpose

React frontend for the `ai-product-integration-be` NestJS backend — a dashboard and playground for
the OpenAI integration module: chat completions, model comparison, prompt templates, token
counting, and audit log / cost visibility. Learning/POC project, desktop-first internal tool.

## Stack

| Layer      | Technology            | Notes                                              |
| ---------- | ---------------------- | --------------------------------------------------- |
| Framework  | React 18 + TypeScript  | Vite, no SSR                                        |
| Styling    | Tailwind CSS 4         | `@tailwindcss/vite` plugin, CSS-var theme in `index.css` |
| Components | shadcn/ui-style        | Hand-adapted (not CLI-generated), in `components/ui/` |
| Routing    | React Router v7        | Declarative `<Routes>`, no data router              |
| Charts     | Recharts               | Dashboard cost-by-model bar chart                   |
| HTTP       | Axios                  | Single instance in `api/client.ts`                  |
| Icons      | lucide-react           |                                                      |
| Theme      | next-themes            | Class-based dark mode (`.dark` on `<html>`)          |
| Toasts     | sonner                 | Mounted once in `App.tsx`                            |

## Commands

```bash
npm run dev       # vite dev server on :5173
npm run build     # tsc -b && vite build
npm run preview   # preview production build
npm run lint       # oxlint
```

## Backend contract

- Base URL: `VITE_API_BASE_URL` (`.env`, defaults to `http://localhost:3000/api/v1`)
- Every successful response is wrapped as `{ success, data, timestamp }` — `api/client.ts`'s
  `unwrap()` helper strips the envelope so API functions in `api/openai.ts` return the inner
  `data` shape directly.
- Every error response is `{ statusCode, message, error, timestamp, path }` — the axios response
  interceptor in `api/client.ts` extracts `message` and shows it via a `sonner` toast, then
  rejects with a plain `Error` so callers can `catch` if they need to react locally (the toast
  still fires either way).
- The backend must have `CORS_ORIGINS` include this app's dev origin (`http://localhost:5173`) —
  set in the backend's `.env`, not here.
- TypeScript types in `types/openai.ts` are hand-mirrored from the backend's DTOs/enums
  (`ai-product-integration-be/src/modules/openai/{dto,constants}/*`). If the backend DTOs change,
  update this file to match — there is no codegen.
- `model` / `models` fields accept either a native `OpenAIModel` value (`gpt-4`, `gpt-4o`,
  `gpt-4o-mini`) or an OpenRouter-style `provider/model-name[:variant]` string — see
  `components/shared/ModelSelect.tsx`, which offers both a preset dropdown and free-text input.
- The Chat Playground calls `POST /openai/chat` per message — there is **no server-side
  conversation memory**. Each request only carries the current prompt/systemPrompt; history shown
  in the UI is client-side only, for display.

## Source Tree

```
src/
  main.tsx / App.tsx     # ThemeProvider + BrowserRouter + Routes + Toaster, mounted once
  vite-env.d.ts          # ImportMetaEnv typing for VITE_API_BASE_URL
  api/
    client.ts            # axios instance, error-toast interceptor, unwrap<T>() envelope helper
    openai.ts             # one function per backend endpoint, thin wrappers over apiClient
  types/
    api.ts                # SuccessResponse<T> / ApiErrorBody envelope shapes
    openai.ts              # DTOs + enums mirrored from the backend (OpenAIModel, AiAuditStatus, PromptTechnique as const objects — see below)
  hooks/
    useAsync.ts            # generic { data, isLoading, error, refetch } hook wrapping a promise fn
  lib/
    utils.ts               # cn() — clsx + tailwind-merge, used by every ui/ component
    format.ts              # formatCost/formatCurrency/formatNumber/formatLatency/formatDateTime
  components/
    ui/                     # shadcn/ui-style primitives (button, card, dialog, select, table, …)
    layout/                 # Sidebar, Header, AppLayout (route Outlet wrapper)
    shared/                 # cross-page building blocks — see below
  pages/
    dashboard/DashboardPage.tsx
    chat/{ChatPage,ChatMessageBubble,types}.tsx
    compare/ComparePage.tsx
    templates/{TemplatesPage,TemplateFormDialog,TemplateTestDialog}.tsx
    tokens/TokensPage.tsx
    audit-logs/{AuditLogsPage,AuditLogRow}.tsx
```

### `components/shared/`

- `ModelSelect` — preset dropdown + free-text input for any model field (used in Chat, Compare,
  Templates form, Tokens).
- `StatusBadge` — colors an `AiAuditStatus` string (SUCCESS=green, FAILED=red, RETRIED=yellow).
- `CircuitStatusBadge` — polls `GET /openai/health` every 30s; used in the header and the
  Dashboard's System Status card so both stay in sync without a shared store.
- `StatCard`, `PageHeader`, `EmptyState`, `TablePagination`, `ThemeToggle` — generic layout pieces.

## Conventions

- **Path alias**: `@/*` → `src/*` (configured in `tsconfig.app.json` + `vite.config.ts`).
- **No TS `enum`**: the backend uses real TS enums, but this project's `tsconfig.app.json` has
  `erasableSyntaxOnly: true`, which forbids them. Enums are mirrored as
  `const X = { A: 'a' } as const; type X = (typeof X)[keyof typeof X];` — same call-site syntax
  (`OpenAIModel.GPT_4O`), erasable at compile time.
- **`verbatimModuleSyntax: true`**: always use `import type { Foo }` (or inline `type` modifier)
  for type-only imports, or the build fails.
- **React 18, not 19**: `create-vite` currently scaffolds React 19 by default — this project pins
  `react`/`react-dom` to `^18.3.1` per spec. Practical consequence: any `components/ui/*` primitive
  that can be used with Radix's `asChild`/`Slot` pattern, or that Radix itself places inside an
  internal `Presence` (exit-animation) wrapper — `Button`, and the `Dialog`/`Select`/`DropdownMenu`
  content-ish subcomponents — **must** use `React.forwardRef`. Upstream shadcn's current generated
  code assumes React 19 (where plain function components accept `ref` as a normal prop) and omits
  `forwardRef`; copying it verbatim under React 18 produces a silent
  `Function components cannot be given refs` warning and broken positioning/focus. If you add a
  new Radix-backed primitive, forward the ref explicitly.
- **`useAsync`**: the standard data-fetching pattern for GET-like calls — `const { data, isLoading, error, refetch } = useAsync(() => getFoo(params), [params])`. It re-runs on dependency-array
  change and exposes `refetch()` for manual invalidation (e.g. after a mutation). Mutations
  (POST/PATCH/DELETE) are called directly and awaited inline in event handlers, then trigger a
  sibling query's `refetch()`.
- **No mock data**: every page fetches from the real backend. Loading state = `Skeleton`, empty
  state = `EmptyState`, error state = toast (via the axios interceptor) — pages don't render their
  own inline error banners.
- **Delete confirmation**: uses `window.confirm()` (see `TemplatesPage`) rather than a dedicated
  alert-dialog component — deliberate scope trim for this POC, revisit if this becomes a real app.

## Environment

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Copy `.env.example` to `.env` before running `npm run dev`. The backend also needs
`http://localhost:5173` in its own `CORS_ORIGINS`.
