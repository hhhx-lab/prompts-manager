## ADDED Requirements

### Requirement: Apply Capability Pack Patch
Accepted pack patches MUST update the target pack and refresh quality/missing slot state.

#### Scenario: Pack patch accepted
- **WHEN** the user accepts a capability pack patch
- **THEN** the pack is updated, quality is recalculated, and patch source is recorded
