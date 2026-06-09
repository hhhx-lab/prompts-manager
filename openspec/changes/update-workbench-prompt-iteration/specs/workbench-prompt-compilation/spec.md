## ADDED Requirements

### Requirement: Compile Optimized Prompt
The system MUST generate a structured optimized prompt from the current prompt content and context.

#### Scenario: Compile without assets
- **WHEN** the user compiles a prompt with no selected assets
- **THEN** the system returns a structured optimized prompt

#### Scenario: Compile with assets
- **WHEN** the user compiles a prompt with selected assets
- **THEN** the output includes fused asset context where relevant

### Requirement: Explain Compilation Inputs
The system MUST explain the main inputs used to produce each compiled prompt.

#### Scenario: Compilation completes
- **WHEN** a compiled prompt is shown
- **THEN** the UI shows input prompt, asset count, references, compile mode, and generated time

#### Scenario: Asset context is used
- **WHEN** assets are included
- **THEN** compilation highlights mention the assets or asset categories used
