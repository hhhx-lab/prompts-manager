## ADDED Requirements

### Requirement: Filter Market Items
The market workspace MUST support filtering by keyword, category, item type, and capability status.

#### Scenario: Keyword filter matches text
- **WHEN** the user types a keyword that appears in item title, summary, author, tags, or scenario
- **THEN** only matching items remain visible

#### Scenario: Type filter is selected
- **WHEN** the user selects asset or capability pack item type
- **THEN** the list only includes that item type

#### Scenario: Status filter is selected
- **WHEN** the user selects a capability status
- **THEN** the list only includes items with that status
