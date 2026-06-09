## ADDED Requirements

### Requirement: Save Satisfactory Version As Asset Draft
The system MUST allow a satisfactory compiled prompt version to become an asset draft.

#### Scenario: User saves as Prompt
- **WHEN** the user saves a compiled version as Prompt
- **THEN** the system creates an editable Prompt asset draft

#### Scenario: User saves as Template
- **WHEN** the user saves a compiled version as Template
- **THEN** the system creates an editable Template asset draft

### Requirement: Handoff Complex Asset Types To Builder
The system MUST hand off Skill, Evaluator, or Workflow creation to the asset builder with context.

#### Scenario: User chooses Skill
- **WHEN** the user chooses to save the version as Skill
- **THEN** the builder opens or receives context for a Skill draft

#### Scenario: User chooses Evaluator or Workflow
- **WHEN** the user chooses Evaluator or Workflow
- **THEN** the builder receives the prompt text and relevant version metadata
