## Why

PromptOps Studio needs a trustworthy settings surface that tells users what is actually configured, what is only usable as prompt context, and what cannot be executed. This matters now because the product is adding assets, capability packs, imports, local marketplace flows, Run Lab, and future MCP/SDK/Tool integrations; without explicit boundaries the UI can accidentally imply executable power that the local environment does not provide.

## What Changes

- Expand the Settings page from a basic status page into a runtime boundary center for backend API health, model provider configuration, local JSON state, marketplace mode, import sources, and tooling capability status.
- Normalize capability status copy around the existing five states: `context_only`, `schema_ready`, `testable`, `connected`, and `executable`.
- Extend `/api/capabilities/check` so the frontend can render provider, state, market, import, and tooling boundary data with safe defaults.
- Add environment variable documentation in `.env.example` with Chinese explanations, acquisition guidance, and required/optional flags.
- Add UI language and data contracts that make market and external-url assets default to non-executable context unless configuration checks and explicit confirmation allow otherwise.
- Preserve no-key and missing-backend degraded operation by showing compile-preview or unavailable-state messaging instead of pretending that model/tool execution is available.

## Capabilities

### New Capabilities

- `settings-status-dashboard`: Settings must show backend API, model provider, local state, marketplace mode, and tooling summaries in one readable dashboard.
- `capability-status-taxonomy`: The product must consistently explain and render the five capability states.
- `environment-config-reference`: The env file and Settings UI must explain all runtime environment variables without exposing secrets.
- `capability-check-api`: The local API must return a structured capability check payload with safe fallback values.
- `state-collection-visibility`: Settings must expose local JSON state collections and local storage compatibility keys.
- `marketplace-runtime-boundary`: Local marketplace mode must be explicit and must not imply remote account or executable permissions.
- `imported-asset-runtime-boundary`: Assets imported from market or external links must default to non-executable status for MCP/SDK/Tool/Connector types.
- `execution-confirmation-gate`: The UI must prevent users from promoting unconnected tooling to executable without configuration evidence and explicit confirmation.
- `degraded-mode-disclosure`: No-key, missing-provider, missing-market, and unknown-tooling states must render as safe degraded modes.

### Modified Capabilities

- None. OpenSpec has no existing specs in this repository, so this change establishes the first behavioral baseline for settings and runtime boundaries.

## Impact

- Frontend: `components/settings/SettingsView.tsx`, `components/library/AssetLibraryCard.tsx`, `components/ops/OpsPrimitives.tsx`, `components/ui/DesignSystem.tsx`.
- Backend: `backend/server.mjs`, especially `/api/capabilities/check`.
- Types: `types.ts` capability check and related runtime boundary types.
- API client: `services/apiClient.ts`.
- Configuration: `.env.example`, `.gitignore` verification for `.env.local`, `data/*.json`, `dist`, and generated `.codex/`.
- Tests/verification: `npm run typecheck`, `npm run build`, `git diff --check`, API smoke checks for `/api/health` and `/api/capabilities/check`.
