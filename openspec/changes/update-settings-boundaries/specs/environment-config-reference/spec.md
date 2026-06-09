## ADDED Requirements

### Requirement: Document Env Variables In Chinese
The repository MUST document every runtime environment variable in `.env.example` with Chinese comments.

#### Scenario: Developer opens env example
- **WHEN** a developer opens `.env.example`
- **THEN** each variable includes its purpose, how to obtain or choose the value, and whether it is required

#### Scenario: Optional variable is documented
- **WHEN** an environment variable is optional
- **THEN** `.env.example` labels it as optional and explains the default behavior

### Requirement: Keep Secrets Out Of Source
The system MUST avoid committing real keys, tokens, proxy credentials, or local secret files.

#### Scenario: Local key file exists
- **WHEN** `.env.local` exists in the repository
- **THEN** it is ignored by git
- **THEN** no real key value is copied into `.env.example`

#### Scenario: Commit preparation runs
- **WHEN** the work is prepared for commit
- **THEN** git status verification confirms `.env.local`, runtime JSON, and generated local config are not staged

### Requirement: Show Env Summary In Settings
The Settings page MUST summarize relevant env variables without exposing secret values.

#### Scenario: Model key is configured
- **WHEN** `GEMINI_API_KEY` exists
- **THEN** Settings displays that the key is configured
- **THEN** Settings does not reveal the key value

#### Scenario: API port uses default
- **WHEN** `API_PORT` is not set
- **THEN** Settings or capability status describes the default local API port
