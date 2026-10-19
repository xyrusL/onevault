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
    │   ├── components/
    │   │   ├── service-activity/         # SUB-FOLDER: Dedicated Email Activity & Generated Service Tags
    │   │   │   ├── MailAccountActivityModalContent.tsx
    │   │   │   ├── MailServiceTagBadge.tsx
    │   │   │   └── index.ts
    │   │   ├── MailAccountList.tsx
    │   │   ├── MailAccountRow.tsx
    │   │   ├── MailActivityList.tsx
    │   │   ├── MailDetailsModalContent.tsx
    │   │   ├── MailFolderGridView.tsx
    │   │   └── MailHeader.tsx
    │   ├── services/                     # mail.service.ts, mail-inbox.service.ts
    │   ├── types/                        # mail.types.ts, mail-service-detector.types.ts, mail-inbox.types.ts
    │   ├── utils/                        # mail-service-detector.utils.ts (Domain & Inbound Service Detection Engine)
    │   └── MailView.tsx
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

---

## Local-First & Debounced Batch Sync Engine

To guarantee instant responsiveness (perceived 0ms write latency) while strictly minimizing database write operations (staying effortlessly within Cloudflare's 100% Free Tier: 100,000 requests/day and 5M D1 reads/day), OneVault employs a **Local-First Debounced Batch Sync Architecture** managed by [`syncQueueService`](../src/shared/services/sync-queue.service.ts).

```text
User Action (Edit Note, Destination, or Filters)
        │
        ▼
[Stage 1: Optimistic Local State]
  ├── React State (0ms Perceived Latency)
  ├── Local Cache (onevault.mail.cache.v1)
  └── Persistent Sync Queue (localStorage: onevault_pending_sync_queue)
        │
        ▼
[Stage 2: Idle Debounce Controller (2500ms)]
  ├── Merges rapid duplicate mutations by item ID
  └── Resets timer on each keystroke or user edit
        │
   ┌────┴──────────────────────────┐
   │                               │
   ▼                               ▼
[Timer Expires (Idle)]      [Browser Lifecycle Event]
                            ├── `visibilitychange` (User switches tab/minimizes)
                            ├── `beforeunload` (User closes browser/window)
                            └── `online` (Network reconnects after offline)
                                   │
                                   ▼
                      [Stage 3: Cloudflare Worker API]
                        ├── PATCH /api/mail/:id
                        └── POST /api/mail/preferences
                                   │
                                   ▼
                      [Stage 4: Cloudflare D1 Database]
                        (Single, consolidated write transaction)
```

### Key Pillars:
1. **0ms Perceived Latency**:
   - Updates to React state and `localStorage` happen synchronously. The UI never freezes or displays blocking modal spinners for small text edits or note changes.
2. **D1 Write Minimization & Batching**:
   - If a user types 50 characters in a note or tweaks a mail destination 5 times in 10 seconds, all 50 intermediate keystrokes are merged into **one single write mutation** by unique ID (`mail_${accountId}`).
3. **Zero Data Loss Guarantee**:
   - In addition to the 2.5-second idle trigger, the sync queue listens to standard browser lifecycle events (`visibilitychange` and `beforeunload`). If the user types a note and immediately closes the tab or switches apps, the queue flushes to the Worker before navigation completes.
4. **Offline Resilience & Auto-Recovery**:
   - Pending items remain in `localStorage`. If the user loses internet connection or reloads the tab, the queue automatically reloads from storage and flushes the moment the browser fires an `online` event.

---

## Universal Automatic Modular Write Pattern

To prevent developers from manually writing custom debouncing or sync boilerplate in every UI component, all write mutations are routed through the shared API layer:

```text
User Makes Changes (Notes, Mails, Folders, Preferences)
                     │
                     ▼
       Domain Service Method (e.g. `mailService.update()`, `notesService.updateNote()`)
                     │
                     ▼
       `apiClient.syncPatch()` / `apiClient.syncPost()` / `apiClient.syncWrite()`
                     │
       ┌─────────────┴────────────────────────┐
       │                                      │
       ▼                                      ▼
[Instant Local Feedback]             [Background Sync Engine]
• Updates memory cache               • Stages in `localStorage`
• Resolves promise immediately (0ms) • Debounces multiple rapid edits
                                     • When idle or tab closed ──> Uploads to D1 Storage
```

### How to use for any new API or Feature:
Instead of calling immediate network writes (`apiRequest` / raw `fetch`):
```ts
// ❌ Old / Direct Way (Writes immediately on every single keystroke, exhausting D1 quotas):
await apiRequest('/api/my-feature/1', { method: 'PATCH', body });

// ✅ Automatic Local-First Sync Way:
await apiClient.syncPatch('/my-feature/1', body, 'my_feature_1', optimisticItem);
```
OR using `apiRequest` with the `sync` flag:
```ts
await apiRequest('/my-feature/1', {
  method: 'PATCH',
  body,
  sync: true,
  syncKey: 'my_feature_1',
  optimisticData: optimisticItem,
});
```
Any UI component calling the service automatically receives:
1. Instant 0ms perceived response.
2. Background consolidation of rapid edits.
3. Safe uploads only when the user pauses or exits.

### Rules for Future AI Agents & Engineers:
| Rule | What to Do | What NOT to Do |
| :--- | :--- | :--- |
| **Component Simplicity** | Call the domain service (`await mailService.update(id, payload)`). | **Never** write custom `setTimeout`, debouncers, or local queue logic in React components. |
| **Mutation Routing** | Route writes through `apiClient.syncPatch()` or `{ sync: true }`. | **Never** fire immediate raw network writes on every keystroke. |
| **Key Deduplication** | Pass a unique `syncKey` (e.g. `mail_${id}`, `note_${id}`). | Don't omit keys on rapid edits, or distinct edits may not coalesce properly. |
| **0ms UI Response** | Update local cache synchronously so UI re-renders instantly. | **Never** show blocking loading spinners or disable form inputs during text editing. |
