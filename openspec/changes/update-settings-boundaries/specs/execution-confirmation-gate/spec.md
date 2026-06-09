## ADDED Requirements

### Requirement: Block Direct Executable Promotion
The Settings page MUST NOT allow users to directly mark an unconnected MCP, SDK, Tool, or Connector as executable.

#### Scenario: Capability is context-only
- **WHEN** a capability status is `context_only`
- **THEN** Settings does not render a control that can promote it directly to `executable`

#### Scenario: Capability is schema-ready
- **WHEN** a capability status is `schema_ready`
- **THEN** Settings explains that schema completeness is not runtime execution permission

### Requirement: Require Configuration Evidence
The system MUST require runtime configuration evidence before a capability can be considered connected.

#### Scenario: Tooling configuration is absent
- **WHEN** no runtime configuration is detected for a tooling capability
- **THEN** the capability remains non-connected and non-executable

#### Scenario: Tooling configuration is present
- **WHEN** runtime configuration is detected for a tooling capability
- **THEN** the system may mark it connected
- **THEN** it still requires explicit confirmation before any real execution

### Requirement: Require Explicit Execution Confirmation
The system MUST require explicit user confirmation before any real MCP, SDK, Tool, or Connector execution.

#### Scenario: Executable gate is not confirmed
- **WHEN** a capability is connected but no execution confirmation exists
- **THEN** the UI does not run the capability

#### Scenario: Future execution is requested
- **WHEN** a user initiates a future real tool execution flow
- **THEN** the UI must show the asset, provider, inputs, outputs, and risk boundary before continuing
