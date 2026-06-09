## ADDED Requirements

### Requirement: Show Local Marketplace Mode
The Settings page MUST explicitly show that marketplace is local-only until remote marketplace configuration exists.

#### Scenario: No remote marketplace configuration exists
- **WHEN** Settings renders marketplace status
- **THEN** it displays local marketplace mode
- **THEN** it does not imply remote login, account sync, or cloud download availability

#### Scenario: Marketplace mode is unknown
- **WHEN** capability check omits marketplace mode
- **THEN** Settings defaults to local-only or unavailable copy

### Requirement: Default Market Assets To Non-Executable
Assets downloaded or installed from the marketplace MUST default to non-executable status for executable-capable asset types.

#### Scenario: Market MCP asset is present
- **WHEN** an asset source is `market` and its type is `mcp`
- **THEN** Settings and asset detail copy indicate that it is not executable by default

#### Scenario: Market SDK asset is present
- **WHEN** an asset source is `market` and its type is `sdk`
- **THEN** the system treats it as context-only or schema-ready until runtime configuration is detected

### Requirement: Explain Marketplace Trust Boundary
The system MUST explain that marketplace assets are reusable context or schemas unless separately configured and trusted.

#### Scenario: User reads market boundary
- **WHEN** the user views marketplace status in Settings
- **THEN** the UI explains that downloaded assets require review before use

#### Scenario: User attempts one-click use
- **WHEN** a marketplace asset or pack is inserted into the workspace
- **THEN** it is used as prompt context unless another capability gate proves it can run
