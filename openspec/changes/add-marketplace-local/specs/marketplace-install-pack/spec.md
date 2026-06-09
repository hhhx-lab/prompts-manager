## ADDED Requirements

### Requirement: Install Capability Pack Item
The market workspace MUST install capability pack market items into local capability packs.

#### Scenario: Pack item is installed
- **WHEN** the user installs a capability pack item without conflicts
- **THEN** the pack is added to local capability packs with `source` set to `market`

#### Scenario: Pack item includes asset snapshots
- **WHEN** the installed pack item includes related asset snapshots
- **THEN** those assets are added to the local asset library subject to conflict policy
