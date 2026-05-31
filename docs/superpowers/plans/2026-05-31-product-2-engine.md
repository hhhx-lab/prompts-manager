# Prompt Engineering 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the first working 2.0 slice of 提示词大师 Pro: separated frontend/backend/docs architecture, backend API, task model, asset slots, PromptIR compiler, feedback diagnosis, and a frontend 2.0 operations view.

**Architecture:** Keep the existing Vite React app as `apps/web` in spirit for now, but introduce clear runtime boundaries immediately: frontend UI and local state remain in React, backend APIs live in `backend/server.mjs`, and documentation/knowledge assets remain under `docs/`. New domain logic is split into focused frontend services so the current large `App.tsx` stops absorbing all 2.0 behavior.

**Tech Stack:** React 19 + Vite + TypeScript frontend, Node.js ESM backend using built-in `http/fs/path/url` modules, local JSON-file backend storage in `data/`, Markdown documentation library in `docs/`, existing Gemini SDK for current AI calls.

---

## File Structure

- Create `backend/server.mjs`: local backend API server with health, docs index, architecture manifest, task analysis, prompt compilation, feedback diagnosis, and JSON persistence endpoints.
- Create `data/.gitkeep`: keeps backend data directory present without committing runtime JSON.
- Create `services/taskAnalysis.ts`: deterministic frontend task model analysis fallback.
- Create `services/promptCompiler.ts`: converts `TaskModel + assets + directions` into `PromptIR` and compiled prompt.
- Create `services/feedbackDiagnosis.ts`: maps user behavior signals into asset patch suggestions.
- Create `services/apiClient.ts`: browser client for backend API calls with graceful fallback.
- Create `components/ops/OpsWorkbench.tsx`: 2.0 UI surface for task card, slots, compiler, feedback and backend/docs health.
- Modify `types.ts`: add TaskModel, PromptIR, PromptCompilation, FeedbackEvent, AssetPatch, AssetSlot and backend/doc types.
- Modify `App.tsx`: add top-level 2.0 view and wire OpsWorkbench with existing assets/directions.
- Modify `package.json`: add `dev:web`, `dev:api`, `dev:all`, `start:api` scripts.
- Modify `.env.example`: add backend port and frontend API base URL.
- Modify `README.md`: document frontend/backend/docs separation and dev commands.
- Modify `.gitignore`: ignore backend runtime JSON files.

## Task 1: Establish Architecture Docs And Runtime Boundary

- [x] Add a technical architecture section to README that states frontend, backend and docs responsibilities.
- [x] Add package scripts:

```json
{
  "dev:web": "vite",
  "dev:api": "node backend/server.mjs",
  "dev:all": "node backend/server.mjs",
  "start:api": "node backend/server.mjs"
}
```

- [x] Add `.env.example` variables:

```bash
API_PORT=8787
VITE_API_BASE_URL=http://127.0.0.1:8787
```

- [x] Add `.gitignore` runtime backend data patterns:

```text
data/*.json
!data/.gitkeep
```

## Task 2: Add 2.0 Domain Types

- [x] Extend `types.ts` with `TaskModel`, `PromptIR`, `PromptCompilation`, `FeedbackEvent`, `AssetPatch`, `AssetSlot`, `DocsIndexItem`, and `BackendHealth`.
- [x] Keep all new types additive so existing history and assets remain compatible.
- [x] Run `npm run typecheck`.

## Task 3: Add Frontend Domain Services

- [x] Create `services/taskAnalysis.ts` with `analyzeTaskLocally(input, assets, directions)`.
- [x] Create `services/promptCompiler.ts` with `buildAssetSlots(...)`, `compilePrompt(...)`, and `formatPromptIR(...)`.
- [x] Create `services/feedbackDiagnosis.ts` with `diagnoseFeedback(...)`.
- [x] Create `services/apiClient.ts` with `getBackendHealth()`, `getDocsIndex()`, `analyzeTaskRemote()`, `compilePromptRemote()`, and `diagnoseFeedbackRemote()`.
- [x] Run `npm run typecheck`.

## Task 4: Add Backend API

- [x] Create `backend/server.mjs`.
- [x] Implement routes:

```text
GET  /api/health
GET  /api/docs/index
GET  /api/architecture
POST /api/task/analyze
POST /api/prompt/compile
POST /api/feedback/diagnose
GET  /api/state/:collection
PUT  /api/state/:collection
```

- [x] Backend must serve CORS headers for local frontend.
- [x] Backend must not require a database.
- [x] Backend must not commit runtime JSON.
- [x] Verify with `node backend/server.mjs` and curl health/docs endpoints.

## Task 5: Add 2.0 Operations Frontend

- [x] Create `components/ops/OpsWorkbench.tsx`.
- [x] Include panels:

```text
Backend / Docs health
Task Model
Asset Slots
PromptIR Compiler
Feedback Diagnosis
2.0 Roadmap Progress
```

- [x] Use backend API when available and local deterministic services when backend is down.
- [x] Do not remove existing workspace or library views.
- [x] Add `ops` to `ViewMode` in `App.tsx`.
- [x] Add a top nav button named `2.0 引擎`.
- [x] Render `OpsWorkbench` when active.

## Task 6: Verify Frontend And Backend Together

- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Start backend: `npm run dev:api`.
- [x] Start frontend: `npm run dev:web -- --host 127.0.0.1 --port 5173`.
- [x] Use Playwright or browser tooling to open frontend and verify:

```text
2.0 引擎 tab is visible.
Backend health is connected.
Docs index count is visible.
Task model can be generated.
PromptIR can be compiled.
Feedback diagnosis produces patch suggestions.
Existing 工作台 and 项目库 still render.
```

## Task 7: Expand 2.0 MVP Loop

- [x] Add backend route `POST /api/assets/build-draft` for Prompt/Skill/MCP/SDK/Workflow asset drafts.
- [x] Add backend route `POST /api/run-lab/compare` for baseline-vs-asset PromptIR comparison.
- [x] Add backend route `POST /api/feedback/insights` for aggregated feedback signals and next actions.
- [x] Add 2.0 UI panels for asset builder, Run Lab asset toggle comparison, and Feedback Insights.
- [x] Verify these panels through browser automation.

## Task 8: Add PromptOps State And Graph Foundations

- [x] Create `services/assetSlots.ts` for slots, ranking and conflict detection.
- [x] Create `services/feedbackEvents.ts`, `services/assetPatches.ts`, and `services/assetGraph.ts`.
- [x] Add local storage keys for TaskModel, PromptCompilation, PromptRun, FeedbackEvent, AssetGraph and AssetPatch.
- [x] Add hooks for TaskModel, PromptCompilation, PromptRun, FeedbackEvent, AssetGraph and AssetPatch persistence.
- [x] Wire the 2.0 engine to save generated task cards, compilations, Run Lab previews, feedback events, patch suggestions and graph edges.

## Task 9: Split 2.0 Frontend Panels

- [x] Move shared panel/status/info UI into `components/ops/OpsPrimitives.tsx`.
- [x] Move TaskModel, AssetSlot and PromptIR UI into `components/workspace/`.
- [x] Move asset builder UI into `components/builders/`.
- [x] Move Run Lab UI into `components/run-lab/`.
- [x] Move feedback diagnosis and insights UI into `components/feedback/`.
- [x] Keep `OpsWorkbench` as the 2.0 state/orchestration container.

## Task 10: Promote 2.0 IA Into First-Class Pages

- [x] Add top-level navigation entries: 工作台、资产库、构建器、运行实验室、反馈洞察、知识库、设置.
- [x] Create `components/builders/BuilderWorkbench.tsx` for task-to-asset-package generation and saving drafts into the library.
- [x] Create `components/run-lab/RunLabWorkbench.tsx` for baseline-vs-asset PromptIR comparison with selectable assets and compile modes.
- [x] Create `components/feedback/FeedbackWorkbench.tsx` for behavior-to-FeedbackEvent diagnosis, AssetPatch review and insights.
- [x] Create `components/knowledge/KnowledgeBaseView.tsx` for backend docs index and architecture manifest browsing.
- [x] Create `components/settings/SettingsView.tsx` for local-first storage, environment and execution-boundary visibility.
- [x] Keep `#ops` route available as an internal 2.0 orchestration dashboard for regression checks.

## Task 11: Expand Builder Coverage To All Asset Types

- [x] Create `services/assetDrafts.ts` for shared local asset draft generation and draft-to-library conversion.
- [x] Update Builder UI to support all 16 asset types: Prompt, Skill, MCP, SDK, Workflow, Reference, Agent, Tool, Template, Evaluator, Dataset, Policy, Memory, Connector, Parser and Benchmark.
- [x] Extend backend draft labels, capabilities, IO, schema previews and core content templates beyond the initial five asset types.
