## ADDED Requirements

### Requirement: Filter Imported Assets
The system MUST include imported assets in existing search and filter flows.

#### Scenario: Imported asset saved
- **WHEN** an imported asset is saved
- **THEN** it can be found by title, tag, type, capability status, quality, and usage filters

#### Scenario: Imported asset injected
- **WHEN** the user injects an imported asset into the workspace
- **THEN** usage count and last used time are updated

### Requirement: Preserve Existing Library Operations
The system MUST preserve existing create, edit, delete, import, export, and inject behavior.

#### Scenario: User edits imported asset
- **WHEN** the user edits an imported asset
- **THEN** the asset keeps normal edit/save/delete behavior
