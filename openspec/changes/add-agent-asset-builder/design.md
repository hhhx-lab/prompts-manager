## Context

Current builder code can generate a draft for a chosen asset type from input. This change makes the builder explicit: manual mode for structured editing, Agent mode for conversational generation, and handoff context for future capability packs.

## Goals / Non-Goals

**Goals:**

- Let users describe the target asset in one sentence.
- Let users paste source material for the Agent to extract asset structure.
- Keep manual type-specific editing available.
- Require user confirmation before saving.
- Default executable-capable assets to safe non-executable statuses.

**Non-Goals:**

- No real tool execution.
- No automatic saving by Agent.
- No authenticated link crawling.
- No full capability-pack editor in this change.

## Decisions

- Reuse `buildLocalAssetDraft` for local Agent fallback and backend draft endpoint for remote orchestration.
- Store handoff context in sessionStorage for now because capability packs are added in a separate change.
- Render mode state locally inside `BuilderWorkbench` to avoid new global routing complexity.

## Risks / Trade-offs

- [Risk] Agent output can appear authoritative. -> Mitigation: always label it as draft and show missing/safety notes.
- [Risk] Mode switching can discard work. -> Mitigation: keep current draft and input in state across modes.
- [Risk] Capability pack handoff has no pack module yet. -> Mitigation: accept/pass context but mark full pack integration as later change.
