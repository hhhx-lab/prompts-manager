## ADDED Requirements

### Requirement: Render Type-Specific Manual Fields
Manual mode MUST render structure guidance for the selected asset type.

#### Scenario: Skill selected
- **WHEN** the user selects Skill
- **THEN** the builder shows trigger, workflow, boundary, and validation guidance

#### Scenario: MCP or SDK selected
- **WHEN** the user selects MCP or SDK
- **THEN** the builder shows interface, input, output, auth, and safety guidance
