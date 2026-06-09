## ADDED Requirements

### Requirement: Preserve User Edits During Iteration
The system MUST use the user-edited version as the source for the next prompt iteration.

#### Scenario: User edits V1 and generates V2
- **WHEN** the user edits V1 and asks for another optimization
- **THEN** V2 uses the edited V1 as source
- **THEN** V2 does not silently revert to the original input

#### Scenario: User edits constraints
- **WHEN** the user edits a constraint or wording in the current version
- **THEN** the next version preserves that core intent unless the user removes it

### Requirement: Track Version Metadata
The system MUST track version metadata for prompt iterations.

#### Scenario: Version is created
- **WHEN** a new version is saved
- **THEN** it stores created time, selected assets, reference files, edit source, and compile settings

#### Scenario: User reviews history
- **WHEN** the user opens version history
- **THEN** V1/V2/V3/V4 can be reviewed without losing their metadata

### Requirement: Compare And Reuse Versions
The system MUST allow users to inspect or reuse previous versions.

#### Scenario: User compares versions
- **WHEN** two versions exist
- **THEN** the workspace provides enough metadata and text to compare them

#### Scenario: User continues from old version
- **WHEN** the user chooses an older version as the source
- **THEN** later compilation uses that version's text and context
