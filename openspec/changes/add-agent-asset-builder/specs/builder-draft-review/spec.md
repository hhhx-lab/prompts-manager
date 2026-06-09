## ADDED Requirements

### Requirement: Review Before Save
The system MUST show generated assets as drafts that require user confirmation.

#### Scenario: Draft generated
- **WHEN** Agent creates a draft
- **THEN** the user can edit or save it

#### Scenario: User saves draft
- **WHEN** the user confirms save
- **THEN** the asset is written to the asset library

### Requirement: Show Completeness
The builder MUST show draft completeness or quality signals.

#### Scenario: Draft has missing fields
- **WHEN** draft fields are incomplete
- **THEN** the builder shows warnings or missing items
