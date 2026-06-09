## ADDED Requirements

### Requirement: Treat Input As Prompt Content
The system MUST treat workspace input as the user's prompt content, not as a generic task-request form.

#### Scenario: User enters prompt content
- **WHEN** the user types prompt text into the workspace input
- **THEN** the UI labels and helper copy describe it as prompt content

#### Scenario: Prompt content is submitted
- **WHEN** the user compiles or optimizes
- **THEN** the submitted payload uses the prompt content as the source text

### Requirement: Preserve Prompt Draft Locally
The system MUST preserve the current prompt draft while the user selects assets, references, or modes.

#### Scenario: User changes asset selection
- **WHEN** the user selects or deselects an asset
- **THEN** the prompt draft remains unchanged

#### Scenario: User navigates workspace panels
- **WHEN** the user moves between workspace panels
- **THEN** the current prompt draft remains available
