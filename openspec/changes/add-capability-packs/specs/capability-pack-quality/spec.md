## ADDED Requirements

### Requirement: Show Quality And Missing Slots
The system MUST show quality score and missing slot suggestions for a capability pack.

#### Scenario: Key slots are missing
- **WHEN** prompt, reference, policy, or evaluator slots are empty
- **THEN** the pack shows missing slot suggestions

#### Scenario: Slots are populated
- **WHEN** more recommended slots have assets
- **THEN** quality score improves
