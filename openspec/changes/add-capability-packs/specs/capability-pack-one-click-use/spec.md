## ADDED Requirements

### Requirement: Use Pack In Workspace
The system MUST allow one-click use of a capability pack in the workspace.

#### Scenario: User clicks use
- **WHEN** the user clicks one-click use
- **THEN** the workspace opens with pack assets selected

#### Scenario: Pack has tooling assets
- **WHEN** the pack includes MCP, SDK, Tool, or Connector assets
- **THEN** they are passed as context only unless executable status is proven elsewhere
