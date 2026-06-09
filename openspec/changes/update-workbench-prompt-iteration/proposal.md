## Why

The workspace is the product's daily entry point, but the current copy and data flow still read like a task-request form. Users need to paste their own prompt content, optionally add assets and reference files, iterate across V1/V2/V3/V4, and keep manual edits as first-class optimization input.

## What Changes

- Reframe the workspace input as prompt content rather than vague task requirements.
- Support asset and future capability-pack context as explicit optimization inputs.
- Preserve user edits when generating later prompt versions.
- Add reference-file context handling for Markdown, TXT, JSON, Word, and Excel uploads.
- Add save-as-asset entry points from a satisfactory compiled version.
- Preserve no-key and backend-off degraded operation through local compile preview and clear copy.
- Keep the workspace usable on desktop and mobile without horizontal overflow.

## Capabilities

### New Capabilities

- `workbench-prompt-input`: Prompt content is the primary user input and is stored as the source for compilation.
- `workbench-asset-selection`: Users can select recommended or manual assets and see what was used.
- `workbench-prompt-compilation`: The workspace compiles an optimized prompt and explains asset/direction usage.
- `prompt-version-iteration`: User edits are preserved across V1/V2/V3/V4 version iteration.
- `attachment-reference-context`: Supported reference files are parsed into local prompt optimization context.
- `workbench-save-as-asset`: Satisfactory prompt versions can become Prompt/Template drafts or builder handoff context.
- `workbench-degraded-mode`: Missing model key or backend unavailability is disclosed without blocking local preview.
- `workbench-responsive-layout`: Workspace panels remain readable and non-overlapping on desktop and mobile.

### Modified Capabilities

- None. Existing OpenSpec specs do not yet define workspace behavior.

## Impact

- Frontend: `components/workspace/PromptOpsWorkspace.tsx`, `App.tsx`, `components/layout/AppShell.tsx`, workspace subpanels.
- Services/API: `services/apiClient.ts`, `services/fileParsing.ts`, `backend/server.mjs`.
- State/types: `PromptCompilation`, `PromptVersion`, `PromptRun`, `FeedbackEvent`, selected asset metadata.
- Validation: typecheck, build, API smoke for analyze/compile, and manual workspace iteration checks.
