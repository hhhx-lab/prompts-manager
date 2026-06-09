## Why

Users need a composition layer above individual assets: a capability pack groups prompts, skills, references, policies, evaluators, tools, and workflows for one reusable scenario. Without packs, users must repeatedly select assets and cannot export or reuse a complete capability bundle.

## What Changes

- Add `CapabilityPack` types and local state persistence.
- Add a capability pack workspace page with list, draft creation, slot editing, quality checks, one-click use, import, and export.
- Allow users to build packs from existing assets and identify missing slots.
- Add builder handoff for missing slots.
- Keep MCP/SDK/Tool assets non-executable inside packs unless settings prove otherwise.

## Capabilities

### New Capabilities

- `capability-pack-model`: Capability packs persist name, scenario, slots, assets, quality, usage, and version metadata.
- `capability-pack-agent-draft`: Users can generate a pack draft from one sentence.
- `capability-pack-slot-editor`: Users can add/remove assets from typed slots.
- `capability-pack-quality`: Packs show missing slots and quality signals.
- `capability-pack-one-click-use`: One click sends pack assets to the workspace.
- `capability-pack-import-export`: Packs support full JSON import/export and missing reference warnings.
- `capability-pack-builder-handoff`: Missing slot actions can open the asset builder with target context.
- `capability-pack-runtime-safety`: Tooling assets in packs remain non-executable by default.

### Modified Capabilities

- None. No existing OpenSpec baseline covers capability packs.

## Impact

- Types: `types.ts`.
- Backend: `capabilityPacks` state collection.
- Hooks/services: `hooks/useCapabilityPacks.ts`, `services/capabilityPacks.ts`.
- UI: new capability pack view and navigation integration.
- Workspace/builder integration: one-click selected assets and builder handoff context.
