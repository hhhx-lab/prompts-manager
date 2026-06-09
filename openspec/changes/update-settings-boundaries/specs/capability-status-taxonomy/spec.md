## ADDED Requirements

### Requirement: Define Five Capability States
The system MUST define and display the five capability states `context_only`, `schema_ready`, `testable`, `connected`, and `executable`.

#### Scenario: User reads state definitions
- **WHEN** the user views Settings capability documentation
- **THEN** all five capability states are listed with clear Chinese explanations

#### Scenario: Status appears in a card
- **WHEN** a capability status is shown in the Settings UI
- **THEN** the label matches one of the five defined states

### Requirement: Map Unknown Status To Safe Status
The system MUST map unknown, missing, or unsupported capability statuses to a safe non-executable state.

#### Scenario: Backend omits a tooling status
- **WHEN** the capability check payload does not include an SDK, MCP, Tool, or Connector status
- **THEN** the frontend treats the missing status as `context_only`

#### Scenario: Backend returns an unrecognized status string
- **WHEN** the frontend receives a status outside the five-state taxonomy
- **THEN** it displays an unknown-safe or context-only label
- **THEN** it does not allow execution from that status

### Requirement: Separate Schema Readiness From Connection
The system MUST distinguish structurally valid assets from connected runtime capabilities.

#### Scenario: Asset schema is complete
- **WHEN** an MCP, SDK, Tool, or Connector asset has complete schema fields
- **THEN** the system may display `schema_ready`
- **THEN** it does not display `connected` unless runtime configuration is detected

#### Scenario: Runtime connection is configured
- **WHEN** runtime configuration is detected for a capability
- **THEN** the system may display `connected`
- **THEN** it still requires a separate executable gate before real execution
