# OneVault — Comprehensive Documentation

Welcome to the **OneVault Documentation Hub**. This directory provides architectural guides, telemetry flows, API specifications, and Cloudflare Worker references.

---

## Documentation Index

| Document | Description |
| :--- | :--- |
| [**Architecture & Directory Guide**](./ARCHITECTURE.md) | Modular Feature-Based Architecture, 3-Tier Design Tokens, Mail Service Detection sub-folders, and Sub-Folder Standards. |
| [**Visual Telemetry & System Flows**](./FLOWS.md) | Mermaid diagrams for API edge health telemetry, Autonomous 5-Layer DDoS Self-Defense, notes canvas, email routing, and Smart Inbound Service Detection & Tagging. |
| [**API & Cloudflare Worker Reference**](./API_WORKER_GUIDE.md) | Complete guide to Cloudflare Worker endpoints, Inbound Service Detection Engine, Autonomous Edge Self-Defense, D1 SQLite schema, and Auth. |

---

## AI Agent Quick Reference
AI Agents should consult these documents when designing new features or investigating cross-cutting platform concerns:
- **Modular Directory Organization**: Never mix domain features in a single file. When a feature has multiple sub-components, group them in an isolated sub-folder (`src/features/<feature>/components/<sub-folder>/`, e.g. `service-activity/` for email purpose tagging).
- **Standard Naming Conventions**:
  - Folders: `kebab-case` (`api-health/`, `full-view/`, `portal-layout/`, `service-activity/`)
  - Components: `PascalCase.tsx` (`ApiHealthLiveMonitor.tsx`, `NoteFullViewModal.tsx`, `MailAccountActivityModalContent.tsx`)
  - Services: `<domain>.service.ts` (`notes.service.ts`, `dashboard.service.ts`, `mail.service.ts`)
  - Types: `<domain>.types.ts` (`notes.types.ts`, `dashboard.types.ts`, `mail-service-detector.types.ts`)
  - Utilities: `<domain>.utils.ts` (`note-embed.utils.ts`, `mail-service-detector.utils.ts`)
- **Shared Components**:
  - Always import [`BaseModal`](../src/shared/components/modals/BaseModal.tsx) from `src/shared/components/modals` for modal dialogs.
  - Always import [`CustomSelect`](../src/shared/components/forms/CustomSelect.tsx) from `src/shared/components/forms` for dropdowns.
  - Primary styling is **Tailwind CSS v4** with semantic tokens (`bg-surface`, `text-fg-primary`, `border-default`).
