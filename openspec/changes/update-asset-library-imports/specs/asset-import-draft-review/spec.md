## ADDED Requirements

### Requirement: Review Draft Before Save
The system MUST show an import draft for user confirmation before writing it to the asset library.

#### Scenario: Draft is generated
- **WHEN** import parsing succeeds
- **THEN** the draft shows suggested type, title, summary, status, source, safety copy, save, and discard actions

#### Scenario: Draft is discarded
- **WHEN** the user discards an import draft
- **THEN** no new asset is added

### Requirement: Save Draft To Library
The system MUST save confirmed import drafts to the asset library.

#### Scenario: Draft is saved
- **WHEN** the user confirms a draft
- **THEN** the asset appears in the library and can be searched, filtered, and injected
