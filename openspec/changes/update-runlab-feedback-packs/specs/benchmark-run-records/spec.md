## ADDED Requirements

### Requirement: Save Benchmark Records
Run Lab MUST allow saving a benchmark record from current comparison/run output.

#### Scenario: Benchmark is saved
- **WHEN** the user saves a benchmark after comparison or run
- **THEN** benchmark state records input, expected output, actual output, metrics, target type, asset ids, pack id, and timestamp

#### Scenario: No output exists
- **WHEN** the user tries to save a benchmark before comparison/run output
- **THEN** Run Lab explains that benchmark evidence is missing
