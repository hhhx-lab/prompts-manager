## ADDED Requirements

### Requirement: Degrade Without Model Key
The workspace MUST disclose missing model configuration and keep compile preview available where possible.

#### Scenario: Missing Gemini key
- **WHEN** `GEMINI_API_KEY` is missing
- **THEN** the workspace shows compile-preview or missing-provider copy

#### Scenario: User compiles while key is missing
- **WHEN** the user compiles without a model key
- **THEN** the workspace does not claim a real model run succeeded

### Requirement: Degrade When Backend Is Unavailable
The workspace MUST show a backend unavailable state without losing local draft state.

#### Scenario: Backend request fails
- **WHEN** analyze or compile request fails because the backend is unavailable
- **THEN** the workspace keeps the prompt draft and selected assets

#### Scenario: Backend recovers
- **WHEN** the backend becomes available again
- **THEN** the user can retry compilation without recreating the prompt
