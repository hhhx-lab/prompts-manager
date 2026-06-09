## Why

Run Lab should prove whether assets and capability packs improve prompt quality, and Feedback Ops should turn user behavior into reviewable improvements for both assets and packs. Without this loop, packs are only reusable bundles, not measurable or iteratively improvable PromptOps units.

## What Changes

- Extend Run Lab so users can compare baseline, selected assets, and selected capability pack variants.
- Display pack coverage, slot risks, and prompt deltas during comparisons.
- Add Evaluator result and Benchmark run types/state for lightweight local evaluation.
- Add basic evaluator scoring UI with clear unavailable reasons when no model key or evaluator asset exists.
- Add benchmark record saving from Run Lab outputs.
- Extend feedback patch model so patches can target either assets or capability packs and have review status.
- Allow accepting/rejecting/snoozing patches; accepting pack patches refreshes pack quality and missing-slot state.

## Capabilities

### New Capabilities

- `runlab-comparison-targets`: Run Lab supports baseline, selected assets, and capability pack targets.
- `runlab-pack-coverage`: Pack comparison displays asset count, slot coverage, missing slots, and risk notes.
- `runlab-degraded-pack-preview`: Pack comparison works in compile-preview mode without model key.
- `evaluator-scoring`: Evaluator assets can produce local/manual scoring summaries and unavailable reasons.
- `benchmark-run-records`: Run Lab can save benchmark records with input, expected output, actual output, metrics, and version metadata.
- `feedback-patch-targeting`: Feedback patches can target assets or capability packs.
- `feedback-asset-patch-application`: Accepted asset patches update version and patch source metadata.
- `feedback-pack-patch-application`: Accepted pack patches update quality/missing state and patch source metadata.
- `feedback-patch-status`: Patch accept/reject/snooze status is persisted and respected in the UI.

### Modified Capabilities

- Existing Run Lab asset comparison remains supported.
- Existing Feedback Ops asset patch flow remains supported.

## Impact

- Types: extend patch/run/evaluator/benchmark types in `types.ts`.
- Storage/backend: add evaluatorResults and benchmarkRuns state collections.
- Hooks/services: add benchmark/evaluator state hooks; extend feedback patch helpers.
- UI: update Run Lab and Feedback workbenches.
- App integration: pass capability packs and pack setters into Run Lab and Feedback.
