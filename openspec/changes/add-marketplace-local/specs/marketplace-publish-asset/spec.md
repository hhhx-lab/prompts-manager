## ADDED Requirements

### Requirement: Publish Local Asset
The market workspace MUST allow publishing a local asset as a market item draft.

#### Scenario: User selects an asset to publish
- **WHEN** the user selects a local asset and confirms publish
- **THEN** a market item containing an asset snapshot is saved

#### Scenario: Publish safety scan finds sensitive content
- **WHEN** the asset content appears to contain a secret, token, API key, or local private path
- **THEN** the publish panel displays a warning before saving
