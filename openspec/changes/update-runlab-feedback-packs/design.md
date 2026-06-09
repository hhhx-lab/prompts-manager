## Context

The app now has `CapabilityPack`, local marketplace, Run Lab asset comparison, runs state, feedback events, and asset patches. This change connects those layers rather than introducing remote experimentation infrastructure.

## Goals / Non-Goals

**Goals:**

- Compare prompt variants with no assets, selected assets, or a selected capability pack.
- Surface pack coverage and missing slots in Run Lab.
- Save benchmark records locally.
- Show evaluator scoring context and degraded reasons.
- Let feedback patches target assets or packs and persist review status.

**Non-Goals:**

- No online A/B traffic splitting.
- No multi-model tournament.
- No real execution of unconfigured MCP/SDK/Tool assets.
- No remote telemetry.

## Decisions

- Run Lab keeps one test task input but adds `comparisonTarget` and `selectedPackId`.
- Pack comparison expands to selected asset ids using `getPackAssetIds`.
- Evaluator scoring is local/manual in v1: evaluator assets define dimensions and thresholds; model scoring is only future-ready when provider config is present.
- Benchmark records persist through `benchmarkRuns` backend state with local fallback.
- `AssetPatch` gains `targetKind` and `status`; pack patches are lightweight changes to summary/tags/expected outputs/missing slot state.
- Accepting a pack patch calls `refreshCapabilityPackQuality` after applying the change.

## Risks / Trade-offs

- [Risk] Evaluator scoring can look like real model judgment without key. -> Mitigation: label as manual/local and show unavailable reason.
- [Risk] Pack patch semantics can become too broad. -> Mitigation: v1 supports simple field updates and quality refresh only.
- [Risk] Extra state collections add migration surface. -> Mitigation: missing state defaults to empty arrays.
