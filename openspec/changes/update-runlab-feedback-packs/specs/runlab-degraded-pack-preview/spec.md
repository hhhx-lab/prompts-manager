## ADDED Requirements

### Requirement: Preview Without Model Key
Run Lab MUST keep pack comparison available without provider configuration.

#### Scenario: No model key and pack selected
- **WHEN** the user runs a pack comparison without model key
- **THEN** Run Lab saves or displays compile preview and `missing_provider_config`

#### Scenario: Tooling asset in pack
- **WHEN** the pack contains MCP/SDK/Tool/Connector assets
- **THEN** Run Lab states they are context/schema only unless configured
