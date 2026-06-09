## ADDED Requirements

### Requirement: Target Assets Or Packs
Feedback Ops MUST allow patch suggestions to target either assets or capability packs.

#### Scenario: Asset target selected
- **WHEN** the patch target kind is asset
- **THEN** the patch uses asset metadata and asset application flow

#### Scenario: Pack target selected
- **WHEN** the patch target kind is capability pack
- **THEN** the patch uses pack metadata and pack application flow
