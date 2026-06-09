## ADDED Requirements

### Requirement: Disclose Local Market Mode
The market workspace MUST clearly disclose local market mode and backend fallback.

#### Scenario: Backend is available
- **WHEN** backend state is available
- **THEN** the market page indicates local JSON state is active

#### Scenario: Backend is unavailable
- **WHEN** backend state cannot be reached
- **THEN** the market page indicates local cache/offline fallback instead of remote market availability
