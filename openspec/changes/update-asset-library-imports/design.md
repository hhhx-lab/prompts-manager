## Context

The repository already has rich asset types and import/export helpers. The missing part is a production-like intake path for files and public URLs that keeps user confirmation and runtime safety explicit.

## Goals / Non-Goals

**Goals:**

- Generate editable asset drafts from supported files and public URL text.
- Preserve `{ version: 1, assets, directions }` JSON compatibility.
- Mark external/market executable-capable imports as `context_only` or `schema_ready`.
- Keep imported assets available to existing search/filter/inject flows.

**Non-Goals:**

- No authenticated scraping, paid document bypass, cookies, or remote market download.
- No real MCP/SDK/Tool execution.
- No cloud database.

## Decisions

- Use local extraction and simple URL fetching/summarization for v1; failed URLs show manual paste guidance.
- Reuse existing asset draft normalization instead of adding a separate import-only asset model.
- Treat source metadata as a safety signal used by Settings and asset cards.

## Risks / Trade-offs

- [Risk] URL fetches can fail due CORS/auth/network. -> Mitigation: return clear failure and manual paste fallback.
- [Risk] Imported tool docs look executable. -> Mitigation: default status stays `context_only`/`schema_ready`.
- [Risk] JSON imports overwrite user assets. -> Mitigation: update by id only and create new assets when id is absent.
