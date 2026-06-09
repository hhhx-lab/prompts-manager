## 1. Capability Data Contract

- [ ] 1.1 Extend `types.ts` with structured capability check sections for provider, state, market, imports, tooling, and execution gates.
- [ ] 1.2 Update `backend/server.mjs` `/api/capabilities/check` to return the extended payload with safe defaults and backward-compatible existing fields.

## 2. Environment And Secret Boundaries

- [ ] 2.1 Rewrite `.env.example` with Chinese comments covering purpose, acquisition method, required/optional status, and default behavior for each variable.
- [ ] 2.2 Update ignore rules and verify commit hygiene so `.env.local`, runtime JSON, `dist`, and generated `.codex/` files are not staged.

## 3. Settings Runtime Dashboard

- [ ] 3.1 Add frontend safe fallback helpers for capability payloads and the five-state taxonomy.
- [ ] 3.2 Update `components/settings/SettingsView.tsx` to show backend, model, local JSON state, marketplace mode, import safety, and tooling summaries.

## 4. Runtime Boundary Presentation

- [ ] 4.1 Add Settings copy that explains market and external-url MCP/SDK/Tool/Connector assets are not executable by default.
- [ ] 4.2 Add execution-gate copy that prevents unconnected tooling from appearing directly promotable to `executable`.

## 5. State And Data Visibility

- [ ] 5.1 Expand Settings state collection and localStorage sections with primary backend JSON state, compatibility cache, and backup/import-export guidance.

## 6. Degraded Mode Disclosure

- [ ] 6.1 Ensure Settings displays safe degraded copy for missing `GEMINI_API_KEY`, missing backend response, unknown market state, and unknown tooling state.

## 7. Validation

- [ ] 7.1 Run `npm run typecheck`, `npm run build`, `git diff --check`, and API smoke checks for `/api/health` and `/api/capabilities/check`.
