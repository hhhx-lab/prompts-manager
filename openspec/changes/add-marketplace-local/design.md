## Context

The product already has local-first asset library state, capability pack state, and a settings page that distinguishes local market mode from remote marketplace configuration. The marketplace change should reuse that architecture instead of adding remote services.

## Goals / Non-Goals

**Goals:**

- Local marketplace CRUD through backend JSON state with localStorage fallback.
- Publish local assets and capability packs into reusable market items.
- Browse, filter, inspect, install, and export/import market items.
- Handle install conflicts explicitly.
- Keep market-installed MCP/SDK/Tool/Connector assets non-executable by default.

**Non-Goals:**

- No remote accounts, payments, comments, moderation, cloud sync, or team permissions.
- No automatic remote update mechanism.
- No real execution of market-downloaded MCP/SDK/Tool assets.

## Decisions

- Represent each market entry as a `MarketItem` snapshot with `itemType: asset | capability_pack | bundle`.
- Store market items in `marketItems` state collection and `promptmaster_market_items_v1` local cache.
- Publish flows generate item drafts from current local assets/packs; users can inspect safety notes before saving.
- Install flows return an explicit `MarketInstallResult` and require conflict strategy selection when a local id/title conflict exists.
- Market-downloaded runtime-like assets are normalized to `context_only` unless the item is later upgraded by settings/capability checks.
- Keep UI compact: left filter/list, right detail/upload/install inspector.

## Risks / Trade-offs

- [Risk] Local marketplace may be mistaken for remote marketplace. -> Mitigation: page header and settings copy explicitly say “本地市场模式”.
- [Risk] Publishing a pack with asset snapshots increases JSON size. -> Mitigation: v1 keeps snapshots but export/import remains user-controlled.
- [Risk] Conflict UX can become complex. -> Mitigation: support three simple strategies: overwrite, duplicate, skip.
- [Risk] Secret leakage during publish. -> Mitigation: run text heuristics and display warnings before saving market items.
