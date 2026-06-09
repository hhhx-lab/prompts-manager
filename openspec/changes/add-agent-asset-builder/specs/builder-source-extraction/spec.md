## ADDED Requirements

### Requirement: Use Source Text For Drafting
The builder MUST allow pasted source text to influence Agent draft generation.

#### Scenario: User pastes document content
- **WHEN** Agent mode has source text
- **THEN** generated draft content reflects that source

#### Scenario: Source text is absent
- **WHEN** no source text is provided
- **THEN** generation still works from the plain description

### Requirement: Accept Future Link Handoff
The builder MUST have a place to receive source URL or external import context.

#### Scenario: Handoff exists
- **WHEN** builder handoff context includes source text or URL
- **THEN** builder pre-fills the Agent input area
