## ADDED Requirements

### Requirement: Persist Patch Review Status
Feedback Ops MUST persist accepted, rejected, and snoozed patch statuses.

#### Scenario: Patch rejected
- **WHEN** the user rejects a patch
- **THEN** the patch remains stored with rejected status and is not applied

#### Scenario: Patch snoozed
- **WHEN** the user chooses later for a patch
- **THEN** the patch remains stored with snoozed status and is shown as later
