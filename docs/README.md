# OneVault — Comprehensive Documentation

Welcome to the **OneVault Documentation Hub**. This directory provides architectural guides, telemetry flows, API specifications, and Cloudflare Worker references.

---

## Documentation Index

| Document | Description |
| :--- | :--- |
| [**Architecture & Directory Guide**](./ARCHITECTURE.md) | Modular Feature-Based Architecture, 3-Tier Design Tokens, Shared Status Catalog, and Sub-Folder Standards. |
| [**Visual Telemetry & System Flows**](./FLOWS.md) | Mermaid diagrams for API edge health telemetry, Autonomous 5-Layer DDoS Self-Defense, notes canvas, and email routing. |
| [**API & Cloudflare Worker Reference**](./API_WORKER_GUIDE.md) | Complete guide to Cloudflare Worker endpoints, Autonomous Edge Self-Defense (`edge-defense.service.ts`), D1 SQLite schema, and Auth. |

---

## AI Agent Quick Reference
AI Agents should consult these documents when designing new features or investigating cross-cutting platform concerns:
- **Modular Directory Organization**: Never mix domain features in a single file. When a feature has multiple sub-components, group them in an isolated sub-folder (`src/features/<feature>/components/<sub-folder>/`).
- **Standard Naming Conventions**:
  - Folders: `kebab-case` (`api-health/`, `full-view/`, `portal-layout/`)
  - Components: `PascalCase.tsx` (`ApiHealthLiveMonitor.tsx`, `NoteFullViewModal.tsx`)
  - Services: `<domain>.service.ts` (`notes.service.ts`, `dashboard.service.ts`)
  - Types: `<domain>.types.ts` (`notes.types.ts`, `dashboard.types.ts`)
  - Utilities: `<domain>.utils.ts` (`note-embed.utils.ts`, `note-colors.utils.ts`)
- **Shared Components**:
  - Always import [`BaseModal`](../src/shared/components/modals/BaseModal.tsx) from `src/shared/components/modals` for modal dialogs.
  - Always import [`CustomSelect`](../src/shared/components/forms/CustomSelect.tsx) from `src/shared/components/forms` for dropdowns.
  - Primary styling is **Tailwind CSS v4** with semantic tokens (`bg-surface`, `text-fg-primary`, `border-default`).
