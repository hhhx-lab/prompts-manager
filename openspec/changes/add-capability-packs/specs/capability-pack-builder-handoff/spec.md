## ADDED Requirements

### Requirement: Handoff Missing Slot To Builder
The system MUST open asset builder with pack id and slot key when users create a missing slot asset.

#### Scenario: User clicks create missing asset
- **WHEN** the user clicks create for a missing slot
- **THEN** builder receives pack id, slot key, and suggested asset type
