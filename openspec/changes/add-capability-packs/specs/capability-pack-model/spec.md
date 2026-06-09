## ADDED Requirements

### Requirement: Persist Capability Packs
The system MUST persist capability packs in local backend state with local fallback.

#### Scenario: Pack is saved
- **WHEN** the user saves a capability pack
- **THEN** it appears after refresh

#### Scenario: State is empty
- **WHEN** no packs exist
- **THEN** the UI shows an empty state

### Requirement: Track Usage And Version
Capability packs MUST track usage count, last used time, quality score, and version.

#### Scenario: Pack is used
- **WHEN** the user one-click uses a pack
- **THEN** usage count and last used time update
