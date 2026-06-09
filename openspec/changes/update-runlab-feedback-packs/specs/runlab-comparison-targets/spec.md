## ADDED Requirements

### Requirement: Select Run Lab Comparison Target
Run Lab MUST allow choosing baseline-only, selected assets, or selected capability pack as the comparison target.

#### Scenario: Baseline target selected
- **WHEN** the user selects no assets/baseline target
- **THEN** Run Lab compares the prompt against a variant with no injected assets

#### Scenario: Asset target selected
- **WHEN** the user selects asset target and toggles assets
- **THEN** Run Lab uses those assets for the variant prompt

#### Scenario: Capability pack target selected
- **WHEN** the user selects a capability pack
- **THEN** Run Lab uses assets referenced by that pack for the variant prompt
