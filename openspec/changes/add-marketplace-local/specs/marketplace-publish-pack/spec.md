## ADDED Requirements

### Requirement: Publish Capability Pack
The market workspace MUST allow publishing a local capability pack as a market item.

#### Scenario: User selects a capability pack to publish
- **WHEN** the user selects a local capability pack and confirms publish
- **THEN** a market item containing the pack snapshot and related asset snapshots is saved

#### Scenario: Pack has missing assets
- **WHEN** a pack slot references assets that are not present locally
- **THEN** the publish panel includes a safety note about missing snapshots
