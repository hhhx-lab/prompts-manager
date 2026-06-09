## ADDED Requirements

### Requirement: Parse Supported Reference Files
The system MUST parse supported reference files into local prompt context.

#### Scenario: User uploads supported file
- **WHEN** the user uploads Markdown, TXT, JSON, Word, or Excel
- **THEN** the system extracts text and makes it available as reference context

#### Scenario: Multiple references are uploaded
- **WHEN** the user uploads multiple supported files
- **THEN** each file has an independent status and extracted text summary

### Requirement: Handle Unsupported Or Failed Files
The system MUST show clear recovery messages for unsupported or failed reference files.

#### Scenario: Unsupported file is uploaded
- **WHEN** the user uploads an unsupported file type
- **THEN** the workspace shows that the file is not supported for reference parsing

#### Scenario: File parsing fails
- **WHEN** a supported file fails to parse
- **THEN** the workspace keeps the prompt draft and shows the failure reason
