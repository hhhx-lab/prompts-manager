## ADDED Requirements

### Requirement: Select Assets For Compilation
The system MUST allow users to select assets to include as prompt optimization context.

#### Scenario: User selects one asset
- **WHEN** the user selects an asset in the workspace
- **THEN** that asset is included in the next compile request

#### Scenario: User selects no assets
- **WHEN** the user compiles without selecting assets
- **THEN** the compile result states that no external assets were used

### Requirement: Show Used Asset Summary
The system MUST show which assets were used in a compiled version.

#### Scenario: Compilation uses assets
- **WHEN** compilation completes with selected assets
- **THEN** the UI lists asset titles or identifiers used for that version

#### Scenario: Selected asset is unavailable
- **WHEN** a selected asset can no longer be found
- **THEN** the workspace excludes it and shows a recoverable warning
