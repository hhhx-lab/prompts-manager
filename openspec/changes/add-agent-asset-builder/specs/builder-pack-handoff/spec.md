## ADDED Requirements

### Requirement: Receive Capability Pack Slot Context
The builder MUST receive capability pack id and slot context when opened from a missing pack slot.

#### Scenario: Pack handoff exists
- **WHEN** the builder opens with pack context
- **THEN** it displays target pack and slot information

#### Scenario: Asset saved from handoff
- **WHEN** the user saves an asset created from handoff context
- **THEN** the saved asset includes enough metadata for later pack refill
