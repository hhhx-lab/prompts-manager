## ADDED Requirements

### Requirement: Show Runtime Summary Dashboard
The system MUST show backend API, model provider, local state, marketplace mode, and tooling summaries on the Settings page.

#### Scenario: All runtime checks are available
- **WHEN** the Settings page receives a complete capability check response
- **THEN** it displays backend API state, model provider state, local JSON state, marketplace mode, and MCP/SDK/Tool/Connector state in one dashboard

#### Scenario: Capability check is still loading
- **WHEN** the Settings page is open before the capability check resolves
- **THEN** it displays pending or unknown-safe status text without marking unavailable systems as connected

#### Scenario: Capability check fails
- **WHEN** `/api/capabilities/check` cannot be loaded
- **THEN** the Settings page displays a backend unavailable or detection failed state
- **THEN** model and tooling execution are not presented as available

### Requirement: Display Trust Boundaries Before Actions
The system MUST show runtime and safety boundaries before users reach actions that imply model, marketplace, or tooling execution.

#### Scenario: User reviews Settings
- **WHEN** the user opens Settings
- **THEN** the page explains which capabilities are context-only, testable, connected, or executable

#### Scenario: User sees a configured model
- **WHEN** the model provider is configured
- **THEN** the Settings page shows that model execution can be attempted
- **THEN** it does not imply MCP/SDK/Tool execution unless those capabilities are separately configured

### Requirement: Provide Recovery-Oriented Status Copy
The system MUST provide status messages that tell users how to recover from missing configuration without editing secrets in the UI.

#### Scenario: Missing model key
- **WHEN** the model provider is missing `GEMINI_API_KEY`
- **THEN** the Settings page displays that Run Lab and workspace model execution degrade to compile preview

#### Scenario: Missing backend
- **WHEN** the backend API cannot be reached
- **THEN** the Settings page recommends checking the local API service instead of asking for a token in the frontend
