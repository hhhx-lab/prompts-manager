## Context

The product has moved from a single-page prompt optimizer toward a PromptOps workspace. A newer `PromptOpsWorkspace` exists, and legacy `App.tsx` still contains history, comparison, A/B, attachment, and second-pass optimization behavior. This change turns the workspace into the canonical prompt optimization loop while preserving local-first state and no-key preview behavior.

## Goals / Non-Goals

**Goals:**

- Treat the input as the user's prompt content.
- Compile optimized prompts with explicit asset and reference context.
- Preserve manual edits as the source for later versions.
- Expose version history and save-as-asset handoff.
- Keep local compile preview available without `GEMINI_API_KEY`.

**Non-Goals:**

- No real MCP/SDK/Tool execution.
- No remote market download/upload.
- No full capability-pack editor.
- No change to the legacy history localStorage compatibility key.

## Decisions

1. **Workspace owns the current prompt loop.**
   - Use `PromptOpsWorkspace` as the primary UI and keep legacy flows as regression references.
   - Avoid duplicating every old control; only bring forward behavior needed for prompt iteration.

2. **Compile from edited content, not original content.**
   - Store the latest user-edited prompt as the next compile source.
   - Keep version metadata so the user can see which asset set and edit source produced each version.

3. **References are local context.**
   - Parse supported files locally and attach extracted text to the compile request.
   - Unsupported or failed files show recoverable errors and do not block the rest of the workspace.

4. **Degraded mode is a product state.**
   - Missing model key or backend issues are shown directly in the workspace.
   - The UI still allows asset selection, local preview, and version capture where possible.

## Risks / Trade-offs

- [Risk] Old App history and new workspace versions diverge. -> Mitigation: keep compatibility metadata optional and use defaults when older versions are missing fields.
- [Risk] Attachments produce too much context. -> Mitigation: store parsed summaries/text snippets and show file status.
- [Risk] User edits are accidentally overwritten. -> Mitigation: use edited prompt as the explicit next-source and record edit source in version metadata.
- [Risk] Mobile layout becomes cramped. -> Mitigation: use stacked panels and stable minimum dimensions.

## Migration Plan

- Preserve old `promptmaster_history_v2`.
- Treat missing version metadata as empty asset/reference lists.
- Keep old compile preview behavior available if backend features are unavailable.
