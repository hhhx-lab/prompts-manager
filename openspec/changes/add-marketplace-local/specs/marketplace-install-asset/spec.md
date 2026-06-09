## ADDED Requirements

### Requirement: Install Asset Item
The market workspace MUST install asset market items into the local asset library.

#### Scenario: Asset item is installed
- **WHEN** the user installs an asset item without conflicts
- **THEN** the asset is added to the local asset library with `source` set to `market`

#### Scenario: Runtime-like asset is installed
- **WHEN** the installed asset type is MCP, SDK, Tool, or Connector
- **THEN** its capability status defaults to `context_only`

#### Scenario: Download count updates
- **WHEN** an install succeeds
- **THEN** the market item download count increments
