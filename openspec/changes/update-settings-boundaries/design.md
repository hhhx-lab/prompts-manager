## Context

The app is a local-first React + Vite workspace backed by a Node ESM API. The current Settings page already calls `/api/capabilities/check` and shows model/backend/state summaries, but the payload only covers a small subset of the runtime boundary. The v3 product plan requires Settings to become the trusted place where users can see API health, model key state, local JSON state, marketplace mode, import safety, and MCP/SDK/Tool/Connector capability status.

OpenSpec has no existing baseline specs in this repository, so this change establishes the first behavior contracts for settings and runtime boundaries. It must stay compatible with the current local-only storage model and must not introduce cloud credential management or real tool execution.

## Goals / Non-Goals

**Goals:**

- Render a settings dashboard that distinguishes configured, unavailable, context-only, and executable states.
- Extend capability checking with safe defaults for model, backend, market, import, state, and tooling status.
- Document env variables in `.env.example` using Chinese comments, acquisition guidance, and required/optional flags.
- Prevent market, external-url, MCP, SDK, Tool, and Connector assets from appearing executable unless configuration evidence and explicit confirmation exist.
- Preserve no-key operation by showing compile-preview/degraded-mode copy instead of failing the whole app.

**Non-Goals:**

- No remote credential vault, team admin, account binding, or cloud marketplace auth.
- No real MCP/SDK/Tool execution permission flow in this change.
- No new database; state remains local JSON plus localStorage compatibility.
- No hard-coded API keys or tokens in frontend/backend code.

## Decisions

1. **Use one capability check endpoint as the runtime boundary source.**
   - Decision: extend `/api/capabilities/check` as the single API read model for Settings.
   - Rationale: the frontend already has `getCapabilityCheck()`, and one response keeps UI state consistent.
   - Alternative considered: multiple smaller endpoints for model, market, and tooling. Rejected for v1 because the app is local-only and the extra orchestration would add surface area without real remote services.

2. **Make every unknown or missing status safe by default.**
   - Decision: unknown provider/tooling/market fields default to `context_only`, `unconfigured`, or `local_only`.
   - Rationale: the product promise is that unavailable tools must not be presented as executable.
   - Alternative considered: optimistic `schema_ready` for complete-looking assets. Rejected because imported MCP/SDK/Tool assets can be structurally complete yet still not connected.

3. **Separate display status from execution permission.**
   - Decision: `CapabilityStatus` remains the display taxonomy, while execution permission is represented by explicit gates such as configured provider, connection evidence, and confirmation requirements.
   - Rationale: a status like `connected` is not by itself the same as permission to execute.
   - Alternative considered: using only `CapabilityStatus='executable'`. Rejected because it hides the evidence and confirmation requirements.

4. **Keep Settings explanatory but not form-heavy.**
   - Decision: Settings should show statuses, docs, boundaries, and links/entries, not ask users to paste secrets into the app.
   - Rationale: env files are already the project convention, and secrets must not be stored in frontend state.
   - Alternative considered: an in-app key editor. Rejected for this local-first version because it increases accidental secret exposure risk.

5. **Use compatibility fallbacks in the frontend.**
   - Decision: frontend types and UI must tolerate older `/api/capabilities/check` responses missing new fields.
   - Rationale: users may start an older backend or have stale state during local development.
   - Alternative considered: fail hard on shape mismatch. Rejected because Settings itself is the recovery surface.

## Risks / Trade-offs

- [Risk] Capability status copy becomes too verbose for the Settings page. → Mitigation: use compact status cards with detail panels and shared taxonomy text.
- [Risk] Backend and frontend payload types drift. → Mitigation: centralize `CapabilityCheck` in `types.ts`, reuse safe fallback helpers, and validate through API smoke checks.
- [Risk] Users mistake market/imported assets as runnable tools. → Mitigation: render source and execution boundary warnings for market/external-url MCP/SDK/Tool/Connector assets.
- [Risk] Local `.env.local` or runtime JSON is accidentally committed. → Mitigation: keep `.gitignore` coverage and verify with `git status --ignored` before commits.

## Migration Plan

- Extend `CapabilityCheck` with optional fields so older payloads can still render.
- Update backend response to include `market`, `imports`, `state`, `tooling`, and `execution` sections.
- Update Settings UI to read new fields through safe defaults.
- Update `.env.example` comments without touching `.env.local`.
- Rollback path: keep existing model/backend/assets status rendering if new fields are missing.

## Open Questions

- Remote marketplace account configuration remains intentionally out of scope; future work must define identity, trust, and moderation before enabling it.
- Real executable MCP/SDK/Tool confirmation will need a later runtime-specific design once connectors exist.
