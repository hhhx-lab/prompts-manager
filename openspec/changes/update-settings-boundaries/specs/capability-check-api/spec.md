## ADDED Requirements

### Requirement: Return Structured Capability Payload
The local API MUST return a structured capability check payload for backend, model, state, market, imports, tooling, and execution gates.

#### Scenario: Client requests capability check
- **WHEN** the frontend calls `GET /api/capabilities/check`
- **THEN** the response includes backend status, model provider status, state collection status, market mode, import capability status, tooling status, and execution boundary status

#### Scenario: Client posts capability check
- **WHEN** the frontend calls `POST /api/capabilities/check`
- **THEN** the response shape is compatible with the GET response

### Requirement: Detect Model Provider Configuration
The local API MUST detect whether the Gemini provider is configured through environment variables.

#### Scenario: Gemini key exists
- **WHEN** `GEMINI_API_KEY` is present in the backend environment
- **THEN** the capability check marks the model provider as configured and connected

#### Scenario: Gemini key is missing
- **WHEN** `GEMINI_API_KEY` is absent
- **THEN** the capability check marks the model provider as unconfigured or context-only
- **THEN** it includes a compile-preview downgrade message

### Requirement: Return Safe Defaults For Tooling
The local API MUST return safe defaults for MCP, SDK, Tool, and Connector capabilities when no runtime connection is configured.

#### Scenario: No tooling environment is configured
- **WHEN** no MCP, SDK, Tool, or Connector runtime configuration exists
- **THEN** each tooling status is `context_only`
- **THEN** execution is not marked allowed

#### Scenario: Unknown provider is encountered
- **WHEN** the server cannot identify a tooling provider or runtime
- **THEN** the capability check returns a non-executable safe state

### Requirement: Preserve Backward Compatibility
The frontend MUST tolerate older capability payloads that only include backend, model, assets, and timestamp.

#### Scenario: Old backend payload is received
- **WHEN** Settings receives a payload without market, imports, state, tooling, or execution sections
- **THEN** Settings renders default safe values instead of crashing
