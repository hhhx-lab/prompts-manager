## ADDED Requirements

### Requirement: Persist Market Items
The system MUST persist market items in local backend state with localStorage fallback.

#### Scenario: Market item is saved
- **WHEN** the user publishes a market item
- **THEN** the item appears after refresh

#### Scenario: Market state is empty
- **WHEN** no market items exist
- **THEN** the market page shows an empty state and local mode disclosure

### Requirement: Represent Market Metadata
Market items MUST include name, summary, item type, category, author, scenario, capability status, downloads, rating, updated time, included asset count, and safety notes.

#### Scenario: Market item renders metadata
- **WHEN** the user selects a market item
- **THEN** the detail panel displays all required metadata fields
