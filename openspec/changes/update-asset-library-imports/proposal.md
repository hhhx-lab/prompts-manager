## Why

The asset library must become a real intake surface, not only a manually edited list. Users need to import files and public links, review generated drafts, and keep imported executable-capable assets safely non-executable by default.

## What Changes

- Preserve current asset search, filters, JSON import/export, quality, usage, and workspace injection behavior.
- Add safe external URL import that produces a reviewable draft or recoverable failure.
- Keep Markdown/TXT/JSON/Word/Excel file import as local text extraction feeding asset drafts.
- Record source metadata and default runtime status for imported assets.
- Show import draft title, summary, type suggestion, status, source, and save/discard actions.

## Capabilities

### New Capabilities

- `asset-file-import`: Supported files can be parsed into asset drafts.
- `asset-json-import-export`: Versioned JSON import/export remains compatible.
- `asset-url-import`: Public URL input can produce an import draft or failure with manual fallback.
- `asset-import-draft-review`: Drafts expose source, suggested type, safety copy, and save/discard actions.
- `asset-import-runtime-safety`: Imported MCP/SDK/Tool/Connector assets default to non-executable status.
- `asset-library-governance`: Imported assets remain searchable/filterable by type, status, tags, quality, and usage.

### Modified Capabilities

- None. No existing OpenSpec baseline covers the asset library.

## Impact

- Frontend: `App.tsx`, `components/library/*`.
- Services: `services/library.ts`, `services/fileParsing.ts`.
- Backend: import draft endpoint or local URL extraction helper in `backend/server.mjs`.
- State/types: asset source metadata and optional import job/draft payloads.
