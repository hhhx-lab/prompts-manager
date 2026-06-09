## ADDED Requirements

### Requirement: Display Capability Pack Coverage
Run Lab MUST show capability pack coverage when a pack target is selected.

#### Scenario: Pack has missing required slots
- **WHEN** the selected pack has missing slots
- **THEN** Run Lab displays missing slot labels and a risk note

#### Scenario: Pack has assets
- **WHEN** the selected pack references assets present locally
- **THEN** Run Lab displays asset count and slot coverage
