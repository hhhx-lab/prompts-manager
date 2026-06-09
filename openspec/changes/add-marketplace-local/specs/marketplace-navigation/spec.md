## ADDED Requirements

### Requirement: Open Market Workspace
The app MUST expose a primary market navigation item.

#### Scenario: User opens market
- **WHEN** the user clicks the market navigation item
- **THEN** the market workspace is rendered

#### Scenario: Market hash is loaded
- **WHEN** the URL hash is `#market`
- **THEN** the app opens the market workspace
