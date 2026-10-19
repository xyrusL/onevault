# OneVault — Coding Quick Reference

See [**`AGENTS.md`**](./AGENTS.md) for full guidelines and [**`docs/`**](./docs/README.md) for architecture, flowcharts, and API specs.

## Quick Rules
1. **Modular Code**: Keep features in `src/features/<feature>/`. Group multiple child components into a sub-folder (e.g. `api-health/`, `full-view/`) with an `index.ts`.
2. **Naming**:
   - Folders: `kebab-case`
   - Components: `PascalCase.tsx`
   - Services: `<name>.service.ts`
   - Types: `<name>.types.ts`
3. **Shared Components**:
   - Modals: Always use `BaseModal` (`src/shared/components/modals/BaseModal.tsx`).
   - Dropdowns: Always use `CustomSelect` (`src/shared/components/forms/CustomSelect.tsx`).
4. **Styling**: Tailwind with semantic tokens (`bg-surface`, `text-fg-primary`, `border-default`). Put custom CSS in `src/theme/tokens.css`.
5. **Backend**: Cloudflare Worker in `worker/`. Talk to Worker only via `src/shared/services/api-client.service.ts`.
6. **Local-First Debounced Writes**: Never write directly to the server on every keystroke. Use `apiClient.syncPatch()` / `syncPost()` or `{ sync: true }` so mutations stage in `localStorage`, debounce 2.5s, and flush on idle/tab-switch to protect D1 quotas.
7. **Stealth & Privacy**: Never leak security telemetry (risk scores, typo cushions) on error pages. Error messages must always use generic wording ("broken link") instead of "restricted URL" to prevent giving outsiders clues about internal tools.
8. **More Details**: Check [`docs/README.md`](./docs/README.md) for full architecture, diagrams, and API guides.
