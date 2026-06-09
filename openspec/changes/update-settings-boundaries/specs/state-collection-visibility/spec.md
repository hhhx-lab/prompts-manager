## ADDED Requirements

### Requirement: List Backend State Collections
The Settings page MUST list the local JSON state collections exposed by the backend.

#### Scenario: Backend returns state collections
- **WHEN** capability check includes state collection names
- **THEN** Settings displays each collection name

#### Scenario: State collection list is empty
- **WHEN** capability check returns no collections
- **THEN** Settings displays an empty or unavailable state without treating storage as broken

### Requirement: Show Local Storage Compatibility Keys
The Settings page MUST show localStorage compatibility keys used for migration or offline fallback.

#### Scenario: User views storage keys
- **WHEN** the user opens Settings
- **THEN** Settings lists the known localStorage keys for assets, directions, history, task models, compilations, runs, feedback, graph, and patches

#### Scenario: New backend state is preferred
- **WHEN** both backend state and localStorage compatibility keys exist
- **THEN** Settings explains backend JSON state as the primary persistence layer

### Requirement: Provide Data Import Export Entry
The Settings page MUST provide an entry point or guidance for importing and exporting local state.

#### Scenario: User wants a backup
- **WHEN** the user reviews data settings
- **THEN** Settings shows where JSON state import/export is available or how local state can be backed up

#### Scenario: Backend state is unavailable
- **WHEN** backend state cannot be queried
- **THEN** Settings explains that local cache or compatibility storage may still exist
