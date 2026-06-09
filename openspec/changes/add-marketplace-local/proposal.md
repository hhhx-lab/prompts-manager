## Why

Users need a distribution layer for reusable assets and capability packs. A local-first marketplace lets users publish their own Prompt/Skill/MCP/SDK/Workflow/Policy/Evaluator assets, browse shared entries, and download them into their local library without introducing remote accounts, payments, review queues, or executable tooling risk.

## What Changes

- Add local marketplace state and types for market items, categories, install targets, conflict strategy, and install result.
- Add a market workspace with browsing, filtering, detail inspection, upload from local assets/packs, download/install, and JSON import/export.
- Allow local assets and capability packs to become market items with snapshots and safety checks.
- Download market assets into the asset library and market packs into the capability pack library.
- Preserve conservative runtime boundaries: imported MCP/SDK/Tool/Connector content remains non-executable by default.

## Capabilities

### New Capabilities

- `marketplace-model`: Market items persist title, summary, type, category, author, scenario, payload, capability status, downloads, rating, safety notes, and timestamps.
- `marketplace-navigation`: Users can open a market module from primary navigation.
- `marketplace-browse-filter`: Users can filter market items by category, item type, keyword, and capability status.
- `marketplace-detail`: Market details show metadata, included assets, safety notes, status, rating, downloads, and updated time.
- `marketplace-publish-asset`: Users can publish a local asset as a market item after a safety check.
- `marketplace-publish-pack`: Users can publish a local capability pack with pack and asset snapshots.
- `marketplace-install-asset`: Users can install an asset market item into the local asset library.
- `marketplace-install-pack`: Users can install a capability pack market item into local packs and optionally sync included assets.
- `marketplace-conflict-policy`: Installation handles duplicate local assets or packs by overwrite, duplicate, or skip.
- `marketplace-runtime-safety`: Market-installed executable-like assets default to non-executable status.
- `marketplace-local-degraded`: The UI clearly discloses local market mode and backend/local fallback state.

### Modified Capabilities

- None. No existing OpenSpec baseline covers marketplace behavior.

## Impact

- Types: `types.ts`.
- Backend: add `marketItems` state collection.
- Storage: add `promptmaster_market_items_v1`.
- Services/hooks: `services/marketplace.ts`, `hooks/useMarketplace.ts`.
- UI: new marketplace view and navigation integration.
- Integration: app-level install logic writes to existing assets and capability packs collections.
