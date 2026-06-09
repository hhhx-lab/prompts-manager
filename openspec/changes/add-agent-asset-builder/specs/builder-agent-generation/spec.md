## ADDED Requirements

### Requirement: Generate Draft From Natural Language
Agent mode MUST generate asset drafts from a short user description.

#### Scenario: User enters one sentence
- **WHEN** the user describes the desired asset
- **THEN** the builder generates a draft with type, title, summary, content, integration, examples, and next steps

#### Scenario: User leaves description empty
- **WHEN** the user asks Agent generation without input
- **THEN** the builder shows a recoverable validation message

### Requirement: Suggest Missing Items
Agent mode MUST show missing items or next steps for generated drafts.

#### Scenario: Draft is generated
- **WHEN** a draft appears
- **THEN** it includes warnings or next steps before saving
