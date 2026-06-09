## ADDED Requirements

### Requirement: Default Executable-Capable Imports To Safe Status
The system MUST keep imported MCP, SDK, Tool, and Connector assets non-executable by default.

#### Scenario: Imported MCP draft
- **WHEN** an imported draft type is MCP
- **THEN** its default status is not higher than `schema_ready`

#### Scenario: Imported Tool asset
- **WHEN** an imported asset type is Tool
- **THEN** the UI does not show it as executable without runtime configuration

### Requirement: Show Import Safety Copy
The system MUST show safety copy for external URL and market imports.

#### Scenario: External tooling draft appears
- **WHEN** the draft source is external-url and type is MCP, SDK, Tool, or Connector
- **THEN** the draft review explains that it is context/schema only
