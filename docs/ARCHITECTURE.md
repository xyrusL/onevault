# OneVault — Architecture & Directory Guide

## Core Architectural Philosophy
OneVault is built on an enterprise **Feature-Based Architecture** paired with a **3-Tier Semantic Design Token System**, a **Shared Modal UI Shell**, and **Shared Custom Form Controls**.

The primary architectural mandate is **strict modular isolation**:
1. Every domain module lives in its own dedicated folder under `src/features/<feature-name>/`.
2. When a feature expands with multiple related UI units (e.g., live telemetry charts, full-screen canvas tools, modal dialogs), they **must be organized into dedicated kebab-case sub-folders** within `components/`.
3. An AI agent or human engineer should never need to scan the entire codebase to fix an issue or add a feature; they can inspect only the isolated sub-folder.

---

## Complete Directory Map

```text
src/
├── app/                                  # App-level routing & portal section dispatcher
│   └── AdminPortalRouter.tsx             # Dispatches between portal navigation routes
├── theme/                                # Global Design Token & Semantic Theme Architecture
│   ├── tokens.css                        # Tailwind v4 @theme + custom CSS utilities/animations
│   ├── theme.config.ts                   # Theme mode & font-scale types/defaults
│   └── ThemeProvider.tsx                 # Runtime theme/scale React context provider
├── shared/                               # Cross-feature reusable UI & layouts
│   ├── components/
│   │   ├── backgrounds/                  # HalftoneTriangleBg.tsx, PortalHexagonBg.tsx
│   │   ├── brand/                        # OneVaultLogo.tsx (renders brand assets)
│   │   ├── feedback/                     # UnderDevelopmentCard.tsx
│   │   ├── forms/                        # CustomSelect.tsx — SHARED CUSTOM DROPDOWN (never use native <select>)
│   │   ├── modals/                       # BaseModal.tsx — SHARED MODAL SHELL (reuse across all pages!)
│   │   ├── pagination/                   # PaginationBar.tsx — SHARED PAGINATION BAR (`react-paginate`)
│   │   └── theme-controls/               # ThemeControlPill.tsx
│   ├── constants/
│   │   └── api-status-catalog.ts             # SHARED API STATUS CATALOG (translates raw logs across all APIs)
│   ├── layouts/
│   │   └── portal-layout/                # Admin Portal shell, collapsible sidebar, & topbar
│   │       ├── PortalLayout.tsx
│   │       ├── components/               # PortalSidebar.tsx, PortalSidebarItem.tsx, PortalTopbar.tsx
│   │       ├── config/                   # navigation.config.ts
│   │       └── types/                    # portal-navigation.types.ts
│   └── services/                         # Shared services (e.g. api-client.service.ts)
└── features/                             # Isolated domain modules (NEVER mix features in one file)
    ├── auth/                             # Sign-In page, form, and session service
    ├── dashboard/                        # Telemetry & operational health dashboard
    │   ├── components/
    │   │   ├── api-health/               # SUB-FOLDER: Live telemetry curves, filters, & history modals
    │   │   │   ├── ApiHealthLiveMonitor.tsx
    │   │   │   ├── ApiHealthChartCanvas.tsx
    │   │   │   ├── ApiEndpointFilterGrid.tsx
    │   │   │   ├── ApiEndpointHistoryModal.tsx
    │   │   │   ├── ApiIncidentDetailModal.tsx
    │   │   │   ├── ApiPeriodFilterModal.tsx
    │   │   │   ├── ApiStatusPieChart.tsx
    │   │   │   └── index.ts
    │   │   ├── ddos-defense/             # SUB-FOLDER: Autonomous 5-Layer DDoS Self-Defense Modal & Banner (engages on flood)
    │   │   │   ├── DdosEmergencyModal.tsx
    │   │   │   ├── DdosSelfDefenseBanner.tsx
    │   │   │   └── index.ts
    │   │   ├── threat-guard/             # SUB-FOLDER: Adaptive Threat Guard Page View (Security Flow, Graphs, Bar Charts)
    │   │   │   ├── ThreatDefenseView.tsx
    │   │   │   ├── ThreatGuardBanner.tsx
    │   │   │   └── index.ts
    │   │   ├── MailRoutingMetricsChart.tsx
    │   │   ├── VaultDistributionChart.tsx
    │   │   └── RecentActivityFeed.tsx
    │   ├── services/                     # dashboard.service.ts (Edge telemetry ping, stats, & defense)
    │   ├── types/                        # dashboard.types.ts
    │   └── DashboardView.tsx
    ├── mail/                             # Primary Cloudflare Mail & Inbound Routing module
    ├── tmail/                            # Temporary Mail (Tmail) module
    ├── two-factor/                       # 2FA Authenticator & TOTP token module
    ├── notes/                            # Zero-Knowledge Encrypted Notes & Full Canvas module
    │   ├── components/
    │   │   ├── full-view/                # SUB-FOLDER: Full-screen canvas, charts & media embeds
    │   │   │   ├── NoteFullViewModal.tsx
    │   │   │   ├── NoteFullViewToolbar.tsx
    │   │   │   ├── NoteChartWidget.tsx
    │   │   │   ├── NoteChartInsertModal.tsx
    │   │   │   ├── NoteEmbedMediaWidget.tsx
    │   │   │   ├── NoteMediaInsertModal.tsx
    │   │   │   └── index.ts
    │   │   ├── NoteCard.tsx
    │   │   ├── NoteContentRenderer.tsx
    │   │   ├── NoteEditorModalContent.tsx
    │   │   └── NotesHeader.tsx
    │   ├── services/                     # notes.service.ts
    │   ├── types/                        # notes.types.ts
    │   ├── utils/                        # note-embed.utils.ts, note-colors.utils.ts, note-format.utils.ts
    │   └── NotesView.tsx
    └── settings/                         # Portal Settings & Cloudflare configuration module
```

---

## Standard Professional Naming Conventions
To keep the codebase predictable, follow these conventions:

| Category | Convention | Examples |
| :--- | :--- | :--- |
| **Folders & Sub-Folders** | `kebab-case` | `api-health/`, `full-view/`, `portal-layout/`, `theme-controls/` |
| **React Components** | `PascalCase.tsx` | `BaseModal.tsx`, `NoteFullViewModal.tsx`, `ApiHealthLiveMonitor.tsx` |
| **Feature Main Views** | `<FeatureName>View.tsx` | `DashboardView.tsx`, `NotesView.tsx`, `MailView.tsx` |
| **Services (Business Logic)** | `<feature>.service.ts` | `notes.service.ts`, `dashboard.service.ts`, `auth.service.ts` |
| **Type Definitions** | `<feature>.types.ts` | `notes.types.ts`, `dashboard.types.ts`, `mail.types.ts` |
| **Utility Functions** | `<feature>.utils.ts` | `note-embed.utils.ts`, `note-colors.utils.ts` |
| **Configurations** | `<name>.config.ts` | `navigation.config.ts`, `theme.config.ts` |
| **Public Barrel Exports** | `index.ts` | Public interfaces exported per module/sub-folder |

---

## Sub-Folder Modularization Strategy
When building or refactoring a feature:
1. **Single Responsibility**: Do not place multiple complex components inside a single file. Keep 1 component per file.
2. **Sub-Folder Grouping**: When a group of 3 or more components serve a specific sub-system (e.g. `api-health/` for telemetry or `full-view/` for the note canvas), group them in a dedicated sub-folder under `src/features/<feature>/components/<sub-folder>/`.
3. **Public Barrel Exports**: Include an `index.ts` inside sub-folders so parents can import cleanly:
   ```ts
   import { NoteFullViewModal, NoteChartWidget } from './components/full-view';
   ```

---

## Shared Reusable UI Rules
1. **Shared Modals (`BaseModal.tsx`)**:
   - **Never** create a custom modal wrapper inside a feature folder.
   - Always import [`BaseModal`](../src/shared/components/modals/BaseModal.tsx) from `src/shared/components/modals`.
   - Modals use `z-[9999]` and automatically lock `document.body` scroll while open.
2. **Shared Custom Dropdowns (`CustomSelect.tsx`)**:
   - **Never** use default browser `<select>` / `<option>` elements.
   - Always import [`CustomSelect`](../src/shared/components/forms/CustomSelect.tsx) from `src/shared/components/forms` to preserve our custom styled popovers.
3. **Tailwind CSS + Custom CSS Synergy (`src/theme/tokens.css`)**:
   - Primary styling uses Tailwind CSS semantic token classes (`bg-surface`, `text-fg-primary`, `border-default`).
   - Custom CSS helpers exist in `src/theme/tokens.css` for complex SVG alignment, animations, and custom scrollbars.
