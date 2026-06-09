## ADDED Requirements

### Requirement: Avoid Horizontal Overflow
The workspace MUST avoid horizontal overflow on supported desktop and mobile widths.

#### Scenario: Desktop layout
- **WHEN** the viewport is approximately 1440px wide
- **THEN** input, assets, result, and version areas are visible without incoherent overlap

#### Scenario: Mobile layout
- **WHEN** the viewport is approximately 390px wide
- **THEN** panels stack or resize without horizontal scrolling

### Requirement: Keep Controls Stable
The workspace MUST keep primary controls stable while dynamic content loads or changes.

#### Scenario: Asset recommendations update
- **WHEN** recommendations or compile results update
- **THEN** primary compile and version controls do not jump unpredictably

#### Scenario: Long prompt content is shown
- **WHEN** prompt content is long
- **THEN** text wraps or scrolls within its container without covering adjacent controls
