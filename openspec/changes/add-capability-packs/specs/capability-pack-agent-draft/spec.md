## ADDED Requirements

### Requirement: Generate Pack Draft From Sentence
The system MUST create a capability pack draft from a short scenario description.

#### Scenario: User enters scenario
- **WHEN** the user asks to generate a pack
- **THEN** the system creates name, scenario, inputs, outputs, recommended slots, and missing slots

#### Scenario: Matching assets exist
- **WHEN** local assets match the scenario
- **THEN** the draft recommends them for slots
