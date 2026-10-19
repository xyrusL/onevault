# OneVault — AI Coding Guide

Keep code clean, modular, and consistent. Follow these core guidelines:

## 1. Modular Organization
- **Feature Folders**: Keep each feature isolated in `src/features/<feature-name>/`.
- **Sub-folders**: Group related components into dedicated sub-folders under `components/` (e.g. `api-health/`, `full-view/`) and export them via an `index.ts` barrel file.
- **Single Component Per File**: Keep 1 component per file.

## 2. Standard Naming Conventions
- **Folders & Sub-folders**: `kebab-case` (e.g. `api-health/`, `full-view/`, `two-factor/`)
- **React Components**: `PascalCase.tsx` (e.g. `BaseModal.tsx`, `NoteFullViewModal.tsx`)
- **Main Views**: `<FeatureName>View.tsx` (e.g. `DashboardView.tsx`, `NotesView.tsx`, `MailView.tsx`)
- **Services**: `<feature>.service.ts` (e.g. `notes.service.ts`, `auth.service.ts`)
- **Types**: `<feature>.types.ts` (e.g. `notes.types.ts`, `dashboard.types.ts`)
- **Utilities**: `<feature>.utils.ts` (e.g. `note-embed.utils.ts`, `note-colors.utils.ts`)

## 3. Shared UI Components
- **Modals**: Always use `BaseModal` from `src/shared/components/modals`. Never create custom modal wrappers.
- **Dropdowns**: Always use `CustomSelect` from `src/shared/components/forms`. Never use native HTML `<select>`.
- **Pagination**: Always use `PaginationBar` from `src/shared/components/pagination`.
- **Styling**: Use Tailwind CSS utility classes with semantic tokens (`bg-surface`, `text-fg-primary`, `border-default`). Put custom CSS, keyframes, or scrollbars in `src/theme/tokens.css`.

## 4. Cloudflare Worker (`worker/`)
- Routes in `worker/src/routes/`, business logic in `worker/src/services/`, D1 migrations in `worker/migrations/`.
- Frontend calls the Worker only via `src/shared/services/api-client.service.ts`.

## 5. Stealth & Privacy Security (Zero Information Leakage)
- **Silent Threat Defense**: Threat detection, rate limiting, and honeypot guards must run silently in the background. Never expose telemetry badges, risk scores, rule names, or "typo cushions" on user-facing pages.
- **Neutral 404 Error Wording**: Never use wording like "restricted URL", "protected endpoint", or "admin portal" on public error pages. Always use neutral wording like "broken link" or "page does not exist" so outsiders cannot deduce what private tools exist.

## 6. Need More Context? Check `docs/`
If you need in-depth architectural details, diagrams, or API specifications, check the documentation hub:
- [**`docs/README.md`**](./docs/README.md) — Documentation index
- [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) — Directory map & architecture overview
- [**`docs/FLOWS.md`**](./docs/FLOWS.md) — Mermaid flowcharts & diagrams
- [**`docs/API_WORKER_GUIDE.md`**](./docs/API_WORKER_GUIDE.md) — Cloudflare Worker API & D1 schemas
