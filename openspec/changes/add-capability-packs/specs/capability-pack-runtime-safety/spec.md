## ADDED Requirements

### Requirement: Preserve Tooling Safety In Packs
The system MUST NOT grant execution permission because a tooling asset is inside a capability pack.

#### Scenario: Tool asset added to pack
- **WHEN** a Tool asset is added to a pack
- **THEN** the pack displays it as context/schema unless settings allow execution

#### Scenario: Pack is exported
- **WHEN** a pack with tooling assets is exported
- **THEN** export includes status and safety notes
