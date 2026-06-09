## ADDED Requirements

### Requirement: Inspect Market Item
The market workspace MUST display a detail inspector for the selected market item.

#### Scenario: Asset item is selected
- **WHEN** the selected market item contains an asset payload
- **THEN** the detail inspector shows the asset type, capability status, tags, safety notes, and install actions

#### Scenario: Capability pack item is selected
- **WHEN** the selected market item contains a capability pack payload
- **THEN** the detail inspector shows pack metadata, included assets, missing/safety notes, and install actions
