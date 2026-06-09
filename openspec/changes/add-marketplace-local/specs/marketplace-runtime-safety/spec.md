## ADDED Requirements

### Requirement: Preserve Runtime Safety Boundary
Market content MUST NOT become executable solely because it was downloaded.

#### Scenario: Tooling market item is viewed
- **WHEN** the market item includes MCP, SDK, Tool, or Connector assets
- **THEN** the UI shows that these are context/schema assets unless separately configured

#### Scenario: Tooling market item is installed
- **WHEN** tooling assets are installed from market
- **THEN** they remain non-executable and require later explicit configuration
