## ADDED Requirements

### Requirement: Parse Supported Files Into Drafts
The system MUST parse Markdown, TXT, JSON, Word, and Excel files into reviewable asset drafts.

#### Scenario: Supported file uploaded
- **WHEN** the user uploads a supported file in the asset library
- **THEN** the system extracts text and creates an editable asset draft

#### Scenario: Unsupported file uploaded
- **WHEN** the user uploads an unsupported file
- **THEN** the system shows a clear unsupported-file message

### Requirement: Preserve File Source Metadata
Imported file drafts MUST preserve source file metadata.

#### Scenario: File draft is saved
- **WHEN** the user saves a draft generated from a file
- **THEN** the asset source indicates file import and stores the source name where available
