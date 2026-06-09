## Context

The app already has many asset types and a workspace that can select assets. Capability packs add a scenario-level reusable bundle without introducing cloud state or real tool execution.

## Goals / Non-Goals

**Goals:**

- Local-first capability pack CRUD.
- Asset slot composition with quality/missing slot feedback.
- Import/export JSON.
- One-click workspace use.
- Builder handoff for missing slots.

**Non-Goals:**

- No remote marketplace upload/download.
- No real execution of packed MCP/SDK/Tool assets.
- No team permissions.

## Decisions

- Store packs in backend JSON state with localStorage fallback through `useBackendState`.
- Use slot ids based on existing asset categories: prompt, skill, workflow, reference, policy, evaluator, tooling, template, dataset, benchmark.
- One-click use records usage metadata and passes selected asset ids through existing workspace selection state.

## Risks / Trade-offs

- [Risk] Pack editor can become large. -> Mitigation: v1 uses compact list/detail layout.
- [Risk] Missing asset generation depends on builder. -> Mitigation: handoff through sessionStorage, same as workspace builder handoff.
- [Risk] Full import can conflict with local assets. -> Mitigation: v1 imports packs and warns about missing references; market conflict UX comes later.
