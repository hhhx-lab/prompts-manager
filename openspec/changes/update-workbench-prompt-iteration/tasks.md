## 1. Prompt Input Semantics

- [x] 1.1 Update workspace copy and payload naming so the main input is prompt content rather than a demand/request form.
- [x] 1.2 Preserve the current prompt draft while users change assets, references, or compile mode.

## 2. Asset And Reference Context

- [x] 2.1 Ensure selected assets are included in compilation and the UI lists assets used by each version.
- [x] 2.2 Add reference-file parsing/status handling for supported Markdown, TXT, JSON, Word, and Excel files.

## 3. Prompt Compilation And Iteration

- [x] 3.1 Compile structured optimized prompts with explicit no-asset and with-asset explanations.
- [x] 3.2 Preserve user-edited version text when generating V2/V3/V4 and store version metadata.
- [x] 3.3 Support reviewing, comparing, or continuing from previous prompt versions.

## 4. Save And Handoff

- [x] 4.1 Add save-as Prompt/Template draft entry from a satisfactory compiled version.
- [x] 4.2 Add builder handoff context for Skill, Evaluator, and Workflow drafts.

## 5. Degraded And Responsive States

- [x] 5.1 Show missing-key and backend-unavailable degraded states without losing local prompt draft.
- [x] 5.2 Verify desktop and mobile workspace layout has no horizontal overflow or text overlap.

## 6. Validation

- [x] 6.1 Run OpenSpec validate, typecheck, build, API smoke, and record any browser/manual limitations in the CSV.
