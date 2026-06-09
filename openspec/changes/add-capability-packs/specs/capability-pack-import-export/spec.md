## ADDED Requirements

### Requirement: Export Capability Pack JSON
The system MUST export capability packs as JSON.

#### Scenario: User exports pack
- **WHEN** the user exports a pack
- **THEN** JSON includes version, pack, and referenced asset ids or snapshots

### Requirement: Import Capability Pack JSON
The system MUST import capability pack JSON and warn about missing asset references.

#### Scenario: Missing referenced asset
- **WHEN** imported pack references an asset not in the library
- **THEN** the UI shows missing asset warning
