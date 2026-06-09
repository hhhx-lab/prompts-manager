## ADDED Requirements

### Requirement: Keep Tooling Drafts Non-Executable
The builder MUST default MCP, SDK, Tool, and Connector drafts to non-executable status.

#### Scenario: MCP draft generated
- **WHEN** Agent generates an MCP draft
- **THEN** status is `context_only` or `schema_ready`

#### Scenario: Tool draft saved
- **WHEN** a Tool draft is saved
- **THEN** the UI explains that it is not connected or executable
