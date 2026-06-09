## ADDED Requirements

### Requirement: Resolve Install Conflicts
The market installer MUST support overwrite, duplicate, and skip conflict strategies.

#### Scenario: Overwrite conflict strategy
- **WHEN** a downloaded item conflicts with a local item and strategy is overwrite
- **THEN** the local item is replaced with the market snapshot

#### Scenario: Duplicate conflict strategy
- **WHEN** a downloaded item conflicts with a local item and strategy is duplicate
- **THEN** the downloaded item is saved with a new id and copy suffix

#### Scenario: Skip conflict strategy
- **WHEN** a downloaded item conflicts with a local item and strategy is skip
- **THEN** the local item remains unchanged and install result records skipped ids
