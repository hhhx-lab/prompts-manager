## ADDED Requirements

### Requirement: Create Draft From Public URL
The system MUST allow a public URL to create an import draft when readable.

#### Scenario: URL is readable
- **WHEN** the user enters a readable public URL
- **THEN** the system creates a draft with title, summary, source URL, and suggested asset type

#### Scenario: URL is not readable
- **WHEN** the URL cannot be fetched or summarized
- **THEN** the system shows the failure reason and manual paste fallback

### Requirement: Suggest Type From URL Content
The system MUST infer a draft asset type from URL/content signals.

#### Scenario: API or tool docs imported
- **WHEN** content looks like API, MCP, SDK, or tool documentation
- **THEN** the system suggests MCP, SDK, Tool, or Connector

#### Scenario: Tutorial or policy content imported
- **WHEN** content looks like tutorial, specification, or business document
- **THEN** the system suggests Reference, Policy, Workflow, Skill, or Template
