<div align="center">

# Prompt Master Pro

**The local-first PromptOps command center for turning rough prompts into reusable AI engineering assets.**

![Web App](https://img.shields.io/badge/Web%20App-React%20%2B%20Vite-2563eb)
![Agent System](https://img.shields.io/badge/Agent%20System-PromptOps%20Workbench-7c3aed)
![Local First](https://img.shields.io/badge/Storage-Local%20JSON%20State-059669)
![Model Gateway](https://img.shields.io/badge/Models-OpenAI%20Compatible-111827)
![Tool Gate](https://img.shields.io/badge/Tools-Explicit%20Execution%20Gate-c2410c)

`npm run dev:all`

</div>

> Paste the prompt you were about to send to an AI. Prompt Master Pro helps you turn it into a clear, constrained, asset-aware prompt that can be edited, versioned, tested, and saved as reusable engineering knowledge.

Most prompt tools stop at rewriting text. Prompt Master Pro is built around the full operating loop: raw prompt, asset selection, reference files, optimization, manual edits, confirmed iteration, Run Lab checks, feedback events, and reusable asset packages.

It is designed for people who want better prompts, but also for people building a prompt engineering library: Prompt, Skill, MCP, SDK, Agent, Workflow, Tool, Reference, Evaluator, Policy, and capability packs all live in one local workspace.

## The 30-Second Version

| You bring | Prompt Master Pro gives back |
|---|---|
| A rough prompt you want to send to another AI | A cleaner prompt with role, context, task, constraints, outputs, and quality gates |
| A folder of reusable assets | Asset recommendations and explicit injection into the optimization context |
| A reference file | Parsed Markdown, TXT, JSON, Word, Excel, or CSV context |
| A manual edit after V1 | A confirmed V2/V3/V4 flow that preserves your edits |
| A reusable method or tool idea | A structured asset draft through the Builder Agent |
| A prompt you want to validate | Run Lab preview, model run, evaluator entry point, and run history |

## Why It Feels Different

| Usual path | Prompt Master Pro |
|---|---|
| One-off prompt polishing | A full PromptOps loop with versions, runs, feedback, and asset reuse |
| Feature demos that pretend tools are connected | Capability states make clear what is context-only, testable, connected, or executable |
| Users fill long asset forms manually | Builder Agent can draft assets from a plain-language request, then users refine |
| Prompt edits get overwritten by the next run | "Continue optimization" opens a confirmation step before requesting the model |
| Asset libraries become static folders | Assets can be selected, packed, recommended, injected, exported, and patched |

## Core Workflow

```text
Raw prompt
  |
  v
Analyze intent and gaps
  |
  v
Recommend or select assets
  |
  v
Attach reference files
  |
  v
Optimize prompt through the local model gateway
  |
  v
Edit the optimized prompt by hand
  |
  v
Confirm before generating V2, V3, V4
  |
  v
Run, compare, save, patch, or package
```

The left side of the workbench is for the user's original prompt, not a task intake form. The goal is to improve the prompt the user wants to send to another AI while keeping the user's intent intact.

## Capability Matrix

| Area | What it does | Status |
|---|---|---|
| Prompt Workbench | Optimizes raw prompts, injects selected assets, supports reference files and version iteration | Implemented |
| Asset Library | Manages Prompt, Skill, MCP, SDK, Workflow, Reference, Agent, Tool, Evaluator, Policy, and more | Implemented |
| Capability Packs | Combines existing assets into reusable packs that can be used from the workbench | Implemented |
| Asset Builder | Generates structured asset drafts manually or through Builder Agent conversation | Implemented |
| Run Lab | Compares baseline and asset-injected prompts, runs models when configured, stores run history | Implemented |
| Feedback Insights | Converts edits, copies, retries, and feedback notes into FeedbackEvent and AssetPatch flows | Implemented |
| Tool Execution Gate | Provides local adapter checks and controlled dry-run or execution flow | Implemented as local gate |
| Marketplace | Supports local marketplace records plus remote publish, install, and order contracts | Local contract implemented |
| Team Governance | Provides team spaces, approval requests, and execution boundaries | Local contract implemented |
| Knowledge Base | Indexes `docs/` and exposes product plans, asset specs, and prompt engineering references | Implemented |
| Settings | Shows model, backend, state, MCP, SDK, Tool, and connector capability status | Implemented |

## Prompt Asset Types

Prompt Master Pro currently supports 16 asset types:

```text
prompt, skill, mcp, sdk, workflow, reference, agent, tool,
template, evaluator, dataset, policy, memory, connector, parser, benchmark
```

These assets are not just notes. They are structured engineering context:

| Type | Use it for |
|---|---|
| Prompt | Reusable prompt fragments, roles, templates, output formats, and examples |
| Skill | A task method with trigger rules, workflow steps, references, scripts, and assets |
| MCP | Model Context Protocol server context, tool schema, inputs, outputs, and permissions |
| SDK | SDK initialization, API calls, auth model, error handling, and usage examples |
| Workflow | Multi-step processes, checkpoints, dependencies, fallback paths, and deliverables |
| Reference | Documents, specs, cases, external links, or structured knowledge summaries |
| Agent | Reusable agent roles, missions, tools, memory, collaboration rules, and boundaries |
| Tool | Local commands, HTTP tools, data utilities, or structured execution contracts |
| Evaluator | Scoring dimensions, test inputs, expected output, and failure conditions |
| Policy | Safety, compliance, brand, formatting, team, or operational constraints |

MCP, SDK, Tool, and Connector assets are context-only by default. Real execution requires explicit configuration, an executable asset state, an allowlisted adapter, and user confirmation.

## Preview

### Workbench behavior

```text
Input:
  "Help me write a weekly report."

Optimized output:
  - Defines the assistant role
  - Adds required inputs
  - Adds report structure
  - Adds tone and length constraints
  - Adds missing-information handling
  - Adds a final quality checklist
```

### Iteration behavior

```text
V1 generated
  |
  v
User edits the optimized prompt
  |
  v
User clicks "Continue optimization"
  |
  v
Confirmation panel appears
  |
  v
Only after confirmation does the model generate the next version
```

### Asset injection behavior

```text
Selected Skill + Reference + Policy
  |
  v
Compressed asset context
  |
  v
Prompt optimizer
  |
  v
Final prompt with highlights explaining which assets and directions were used
```

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your OpenAI-compatible model gateway in `.env.local`:

```bash
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://your-gateway.example.com/v1
LLM_API_KEY=sk-your-key
LLM_MODEL=gpt-5.5
LLM_CANDIDATE_MODELS=gpt-5.5
```

Start the frontend and backend together:

```bash
npm run dev:all
```

Open the app:

```text
Frontend: http://127.0.0.1:3000
Backend:  http://127.0.0.1:8787/api/health
```

You can also run services separately:

```bash
npm run dev:api
npm run dev:web
```

## Environment Variables

`.env.example` documents every variable with Chinese comments, including what it does, whether it is required, and how to obtain it.

| Variable | Purpose |
|---|---|
| `LLM_PROVIDER` | Provider label for UI and run records |
| `LLM_BASE_URL` | OpenAI-compatible API base URL |
| `LLM_API_KEY` | Model API key |
| `LLM_MODEL` | Default model name |
| `LLM_CANDIDATE_MODELS` | Candidate models for multi-model Run Lab experiments |
| `MODEL_TIMEOUT_MS` | Model request timeout, default 180000ms |
| `MODEL_TEMPERATURE` | Default model temperature |
| `MODEL_TLS_REJECT_UNAUTHORIZED` | Whether backend model calls verify HTTPS certificates |
| `ENABLE_TOOL_EXECUTION` | Enables the real tool execution gate when set to true |
| `TOOL_EXECUTION_ALLOWLIST` | Adapter IDs allowed for tool execution |
| `TOOL_EXECUTION_TIMEOUT_MS` | Per-adapter execution timeout |
| `API_PORT` | Local Node API port |
| `VITE_API_BASE_URL` | Frontend API base URL |

Legacy names such as `MODEL_NAME`, `MODEL_BASE_URL`, `MODEL_API_KEY`, `MODEL_PROVIDER`, and `MODEL_CANDIDATE_MODELS` remain compatible, but `LLM_*` is the preferred configuration style.

## Local State Model

The app uses backend JSON state first, with browser `localStorage` as compatibility cache and offline fallback.

| Collection | localStorage key | Purpose |
|---|---|---|
| `assets` | `promptmaster_asset_library_v1` | Asset library |
| `directions` | `promptmaster_directions_v1` | Optimization directions |
| `taskModels` | `promptmaster_task_models_v1` | Prompt analysis cards |
| `compilations` | `promptmaster_prompt_compilations_v1` | Optimized prompt versions |
| `runs` | `promptmaster_prompt_runs_v1` | Run Lab records |
| `feedbackEvents` | `promptmaster_feedback_events_v1` | User behavior events |
| `assetPatches` | `promptmaster_asset_patches_v1` | Asset patch suggestions |
| `assetGraph` | `promptmaster_asset_graph_v1` | Asset relationship graph |
| `capabilityPacks` | `promptmaster_capability_packs_v1` | Capability packs |
| `marketItems` | `promptmaster_market_items_v1` | Local marketplace items |
| `remoteMarketItems` | `promptmaster_remote_market_items_v1` | Remote marketplace contract records |
| `marketAccounts` | `promptmaster_market_accounts_v1` | Marketplace account contracts |
| `marketOrders` | `promptmaster_market_orders_v1` | Marketplace order placeholders |
| `evaluatorResults` | `promptmaster_evaluator_results_v1` | Evaluator results |
| `benchmarkRuns` | `promptmaster_benchmark_runs_v1` | Benchmark runs |
| `teamSpaces` | `promptmaster_team_spaces_v1` | Team spaces |
| `approvalRequests` | `promptmaster_approval_requests_v1` | Approval requests |
| `onlineExperiments` | `promptmaster_online_experiments_v1` | Online experiment contracts |

The legacy key `promptmaster_history_v2` remains compatible.

## Architecture

```text
React + Vite UI
  |
  v
services/apiClient.ts
  |
  v
Node.js local API in backend/server.mjs
  |
  |-- data/*.json local state
  |-- docs/ index
  |-- OpenAI-compatible model gateway
  `-- gated Tool/MCP/SDK adapters
```

Key backend routes:

| Route | Purpose |
|---|---|
| `GET /api/health` | Backend health check |
| `GET /api/docs/index` | Local docs index |
| `GET /api/capabilities/check` | Backend, model, state, and tool capability status |
| `GET /api/state/:collection` | Read local JSON state |
| `PUT /api/state/:collection` | Write local JSON state |
| `POST /api/model/chat` | Unified model gateway |
| `POST /api/task/analyze` | Prompt analysis |
| `POST /api/run-lab/run` | Run a prompt through the configured model |
| `POST /api/run-lab/multi-run` | Run across candidate models |
| `POST /api/evaluator/score` | Evaluator scoring entry point |
| `POST /api/tools/execute` | Gated Tool/MCP/SDK adapter execution |
| `POST /api/market/remote/publish` | Remote marketplace publish contract |
| `POST /api/teams/approval` | Team approval request contract |
| `POST /api/experiments/online/create` | Online experiment contract |

## Development Commands

```bash
npm run typecheck
npm run build
node --check backend/server.mjs
npm run preview
```

## Repository Layout

```text
.
|-- App.tsx
|-- backend/
|   `-- server.mjs
|-- components/
|   |-- builders/
|   |-- feedback/
|   |-- governance/
|   |-- knowledge/
|   |-- layout/
|   |-- library/
|   |-- marketplace/
|   |-- ops/
|   |-- packs/
|   |-- run-lab/
|   |-- settings/
|   |-- ui/
|   `-- workspace/
|-- hooks/
|-- services/
|   |-- apiClient.ts
|   |-- assetDrafts.ts
|   |-- capabilityPacks.ts
|   |-- feedbackDiagnosis.ts
|   |-- fileParsing.ts
|   |-- library.ts
|   |-- marketplace.ts
|   |-- promptCompiler.ts
|   |-- starterAssets.ts
|   `-- taskAnalysis.ts
|-- scripts/
|   `-- dev-all.mjs
|-- docs/
|   |-- asset-package-specs/
|   |-- prompt-engineering-knowledge/
|   |-- product-plan-promptops-studio-v3.md
|   `-- starter-assets-v2.md
|-- modelService.ts
|-- types.ts
|-- package.json
`-- README.md
```

## Documentation Map

| Path | What it contains |
|---|---|
| `docs/product-plan-promptops-studio-v3.md` | Full product plan for the PromptOps studio direction |
| `docs/starter-assets-v2.md` | Starter asset additions and descriptions |
| `docs/asset-package-specs/README.md` | Asset package specifications |
| `docs/prompt-engineering-knowledge/README.md` | Prompt engineering knowledge base |
| `openspec/` | OpenSpec changes, specs, and task breakdowns |
| `plan/` | Requirement quality-gate plans |
| `issues/` | Issues CSV execution records generated from OpenSpec tasks |

## Safety Boundaries

Prompt Master Pro is intentionally conservative around credentials, tools, and automation:

- Do not commit `.env.local`, real API keys, tokens, cookies, local proxy settings, or generated runtime state.
- Do not commit `data/*.json`, `dist/`, `node_modules/`, `.codex/`, or local debug artifacts.
- MCP, SDK, Tool, and Connector assets do not execute by default.
- Real tool execution requires `ENABLE_TOOL_EXECUTION=true`, `status=executable`, an allowlisted adapter, and explicit user confirmation.
- Model failures are not disguised as successful optimization results.
- Continuing to a new prompt version requires user confirmation before the model request is sent.
- Cloud marketplace, account systems, payment, comments, ratings, team permissions, and online traffic experiments are represented as local contracts until real services are connected.

## Roadmap

This repository already focuses on the local single-user PromptOps loop. The next high-value steps are:

| Direction | What to add next |
|---|---|
| Real marketplace | Accounts, cloud publish, review, download, comments, ratings, and payments |
| Team collaboration | Members, roles, permissions, internal marketplace, and approval workflows |
| Adapter ecosystem | More MCP, SDK, Tool, and Connector adapters with audit logs |
| Conversational Builder | Deeper file understanding, multi-turn completion, auto-fill, and quality scoring |
| Online experiments | Real traffic split, metrics, significance checks, and version rollback |

## Star This If

Star this repo if you want a prompt tool that behaves less like a text box and more like a PromptOps operating system: assets, versions, runs, policies, evaluators, feedback, and controlled execution in one local-first workspace.
