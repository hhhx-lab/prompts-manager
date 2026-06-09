## ADDED Requirements

### Requirement: Import Versioned Asset JSON
The system MUST import `{ version: 1, assets, directions }` JSON while preserving compatibility.

#### Scenario: Existing asset id is imported
- **WHEN** imported JSON contains an asset id already in the library
- **THEN** the existing asset is updated by id

#### Scenario: Asset id is missing
- **WHEN** imported JSON contains an asset without id
- **THEN** the system creates a new asset id

### Requirement: Export Versioned Asset JSON
The system MUST export local assets in the versioned JSON format.

#### Scenario: User exports library
- **WHEN** the user exports assets
- **THEN** the file contains version, assets, and optional directions
