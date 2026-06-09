## ADDED Requirements

### Requirement: Disclose Missing Provider Degradation
The system MUST disclose missing provider configuration as a degraded mode instead of a fatal app error.

#### Scenario: Model key is missing
- **WHEN** `GEMINI_API_KEY` is missing
- **THEN** Settings displays missing provider configuration
- **THEN** Run Lab and workspace model execution are described as compile-preview only

#### Scenario: Model key is restored
- **WHEN** `GEMINI_API_KEY` is present after backend restart
- **THEN** Settings displays the provider as configured
- **THEN** compile-preview-only messaging is no longer shown for model execution

### Requirement: Disclose Missing Backend Degradation
The system MUST disclose backend API unavailability without losing the whole settings surface.

#### Scenario: Backend cannot be reached
- **WHEN** Settings cannot load capability check
- **THEN** it displays an unavailable backend state
- **THEN** it keeps static env, storage, and boundary information visible

### Requirement: Disclose Unknown Tooling Degradation
The system MUST disclose unknown MCP, SDK, Tool, or Connector capability states as non-executable degraded modes.

#### Scenario: Tooling status is unknown
- **WHEN** a tooling capability has no recognized status
- **THEN** Settings displays an unknown or context-only state
- **THEN** no real execution control is available

#### Scenario: Marketplace state is unknown
- **WHEN** marketplace capability state is unknown
- **THEN** Settings displays local-only or unavailable market copy
