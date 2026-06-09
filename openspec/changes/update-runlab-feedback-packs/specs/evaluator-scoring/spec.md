## ADDED Requirements

### Requirement: Show Evaluator Scoring Context
Run Lab MUST surface evaluator dimensions, threshold, and scoring availability.

#### Scenario: Evaluator assets selected
- **WHEN** evaluator assets are selected or included in a pack
- **THEN** Run Lab displays dimensions and pass threshold

#### Scenario: Scoring unavailable
- **WHEN** no evaluator asset or no model key is available
- **THEN** Run Lab displays the reason and manual review guidance
