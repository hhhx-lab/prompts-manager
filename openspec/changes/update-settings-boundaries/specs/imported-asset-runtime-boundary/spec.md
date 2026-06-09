## ADDED Requirements

### Requirement: Default External Imports To Safe Status
Assets imported from external links MUST default to a safe non-executable status when their type can represent executable tooling.

#### Scenario: External URL imports Tool asset
- **WHEN** an asset source is `external-url` and its type is `tool`
- **THEN** the system displays that it is not executable by default

#### Scenario: External URL imports Connector asset
- **WHEN** an asset source is `external-url` and its type is `connector`
- **THEN** the system treats it as context-only or schema-ready until connection evidence exists

### Requirement: Surface Source-Based Safety Copy
The Settings page and asset detail surfaces MUST show safety copy for assets imported from market or external links.

#### Scenario: Imported executable-capable asset is selected
- **WHEN** the user views an imported MCP, SDK, Tool, or Connector asset
- **THEN** the UI shows its source and execution boundary

#### Scenario: Imported reference asset is selected
- **WHEN** the user views an imported Reference asset
- **THEN** the UI may treat it as prompt context without showing execution warnings

### Requirement: Do Not Upgrade Imported Assets Automatically
The system MUST NOT automatically upgrade imported assets to `connected` or `executable`.

#### Scenario: Imported asset has complete integration fields
- **WHEN** an imported MCP, SDK, Tool, or Connector asset has entry name, inputs, outputs, and constraints
- **THEN** the system may mark it schema-ready
- **THEN** it does not mark it connected or executable without runtime evidence
