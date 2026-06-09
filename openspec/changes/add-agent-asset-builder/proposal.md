## Why

The builder must solve the user's "I do not know how to write Skill/MCP/Workflow" problem. A form-only builder is not enough; users need both manual structured editing and an Agent mode that turns one sentence, documents, or links into reviewable asset drafts.

## What Changes

- Add manual/Agent builder mode switching without losing drafts.
- Keep type-specific structured fields for manual mode.
- Add Agent generation from plain language, pasted source text, and imported context.
- Show draft completeness, missing items, safety notes, and save confirmation.
- Support capability-pack slot handoff context without auto-saving.

## Capabilities

### New Capabilities

- `builder-mode-switching`: Users can switch between manual and Agent modes without losing draft state.
- `builder-manual-structured-fields`: Manual mode renders type-specific fields for all asset types.
- `builder-agent-generation`: Agent mode generates one or more draft assets from natural language.
- `builder-source-extraction`: Pasted documents or links can be used as draft source context.
- `builder-draft-review`: Drafts show completeness, missing fields, safety copy, edit, save, and discard.
- `builder-pack-handoff`: Builder can receive capability-pack slot context and return a saved asset.
- `builder-runtime-safety`: MCP/SDK/Tool/Connector drafts stay non-executable by default.

### Modified Capabilities

- None. No existing OpenSpec baseline covers asset builder behavior.

## Impact

- Frontend: `components/builders/BuilderWorkbench.tsx`.
- Services/API: `services/assetDrafts.ts`, `services/apiClient.ts`, `backend/server.mjs`.
- State/types: `AssetBuilderDraft`, optional build mode/session metadata.
