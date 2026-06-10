
export enum ScenarioType {
  GENERAL = '通用场景',
  STUDY = '学习备考',
  WORK = '职场办公',
  CREATIVE = '创意写作',
  PROFESSIONAL = '专业咨询'
}

export enum StyleMode {
  ACADEMIC = '学术严谨型',
  BUSINESS = '商务正式型',
  CASUAL = '口语亲切型',
  CREATIVE = '创意文艺型',
  TECHNICAL = '技术专业型'
}

export type AssetType =
  | 'prompt'
  | 'skill'
  | 'mcp'
  | 'sdk'
  | 'workflow'
  | 'reference'
  | 'agent'
  | 'tool'
  | 'template'
  | 'evaluator'
  | 'dataset'
  | 'policy'
  | 'memory'
  | 'connector'
  | 'parser'
  | 'benchmark';

export type CapabilityStatus = 'context_only' | 'schema_ready' | 'testable' | 'connected' | 'executable';

export interface AssetIntegration {
  entryName: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  constraints: string[];
  usageNotes: string;
}

export interface PromptAssetSchema {
  role: string;
  context: string;
  task: string;
  variables: string[];
  constraints: string[];
  outputFormat: string;
  evaluationCriteria: string[];
  antiPatterns: string[];
}

export interface SkillAssetSchema {
  trigger: {
    description: string;
    explicitInvocations: string[];
    implicitSignals: string[];
    avoidWhen: string[];
  };
  packageStructure: string[];
  resources: {
    skillMd: string;
    references: string[];
    scripts: string[];
    assets: string[];
    agents: string[];
    mcp: string[];
  };
  workflow: string[];
  boundaries: string[];
  validation: string[];
  handoff: string[];
}

export interface McpAssetSchema {
  server: {
    name: string;
    transport: 'stdio' | 'streamable-http' | 'sse' | 'unknown';
    auth: string;
    runtime: string;
  };
  tools: {
    name: string;
    description: string;
    inputSchema: string;
    outputSchema: string;
    annotations: string[];
  }[];
  resources: string[];
  prompts: string[];
  errorHandling: string[];
  security: string[];
  evaluations: string[];
}

export interface SdkAssetSchema {
  package: {
    name: string;
    language: string;
    version: string;
    install: string;
  };
  initialization: string;
  auth: string;
  coreMethods: {
    name: string;
    purpose: string;
    parameters: string[];
    returns: string[];
    errors: string[];
  }[];
  examples: string[];
  compatibility: string[];
  testing: string[];
}

export interface WorkflowAssetSchema {
  goal: string;
  actors: string[];
  triggers: string[];
  inputs: string[];
  stages: {
    name: string;
    objective: string;
    actions: string[];
    outputs: string[];
    qualityGate: string[];
  }[];
  state: string[];
  failureHandling: string[];
  finalOutputs: string[];
}

export interface ReferenceAssetSchema {
  source: string;
  version: string;
  scope: string;
  keyFacts: string[];
  terminology: string[];
  citationRules: string[];
  limitations: string[];
  freshness: string;
}

export interface AgentAssetSchema {
  identity: string;
  goals: string[];
  instructions: string[];
  tools: string[];
  memoryStrategy: string;
  planningStrategy: string;
  stopConditions: string[];
  failureHandling: string[];
  outputContract: string;
}

export interface ToolAssetSchema {
  name: string;
  purpose: string;
  parameters: string[];
  returns: string[];
  preconditions: string[];
  sideEffects: string[];
  fallback: string[];
  examples: string[];
}

export interface TemplateAssetSchema {
  structure: string[];
  slots: string[];
  fillRules: string[];
  variants: string[];
  outputFormat: string;
  constraints: string[];
}

export interface EvaluatorAssetSchema {
  target: string;
  dimensions: string[];
  scoringRubric: string[];
  passThreshold: string;
  failureCases: string[];
  reviewMode: 'manual' | 'ai' | 'hybrid';
  outputFormat: string;
}

export interface DatasetAssetSchema {
  purpose: string;
  itemSchema: string;
  positiveExamples: string[];
  negativeExamples: string[];
  labels: string[];
  splitStrategy: string;
  qualityNotes: string[];
}

export interface PolicyAssetSchema {
  domain: string;
  rules: string[];
  triggers: string[];
  enforcement: string[];
  escalation: string[];
  refusalStyle: string;
  examples: string[];
}

export interface MemoryAssetSchema {
  facts: string[];
  preferences: string[];
  projectConventions: string[];
  scope: string;
  confidence: string;
  updatedAtText: string;
  invalidationRules: string[];
}

export interface ConnectorAssetSchema {
  service: string;
  endpoints: string[];
  auth: string;
  environment: string[];
  permissions: string[];
  dataBoundaries: string[];
  rateLimits: string[];
  operationalNotes: string[];
}

export interface ParserAssetSchema {
  inputTypes: string[];
  extractionFields: string[];
  cleaningRules: string[];
  outputSchema: string;
  validationRules: string[];
  failureHandling: string[];
}

export interface BenchmarkAssetSchema {
  target: string;
  tasks: string[];
  inputs: string[];
  expectedOutputs: string[];
  metrics: string[];
  regressionNotes: string[];
}

export type AssetSchema =
  | PromptAssetSchema
  | SkillAssetSchema
  | McpAssetSchema
  | SdkAssetSchema
  | WorkflowAssetSchema
  | ReferenceAssetSchema
  | AgentAssetSchema
  | ToolAssetSchema
  | TemplateAssetSchema
  | EvaluatorAssetSchema
  | DatasetAssetSchema
  | PolicyAssetSchema
  | MemoryAssetSchema
  | ConnectorAssetSchema
  | ParserAssetSchema
  | BenchmarkAssetSchema;

export interface PromptAsset {
  id: string;
  type: AssetType;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  useCases: string[];
  integration: AssetIntegration;
  schema?: AssetSchema;
  examples: string[];
  status?: CapabilityStatus;
  qualityScore?: number;
  usageCount?: number;
  lastUsedAt?: number;
  source?: string;
  version?: number;
  createdAt: number;
  updatedAt: number;
}

export type CapabilityPackSlotKey =
  | 'prompt'
  | 'skill'
  | 'workflow'
  | 'reference'
  | 'policy'
  | 'evaluator'
  | 'tooling'
  | 'template'
  | 'dataset'
  | 'benchmark';

export interface CapabilityPackSlot {
  key: CapabilityPackSlotKey;
  label: string;
  acceptedTypes: AssetType[];
  assetIds: string[];
  role: string;
  required: boolean;
}

export interface CapabilityPack {
  id: string;
  name: string;
  summary: string;
  scenario: string;
  tags: string[];
  typicalInputs: string[];
  expectedOutputs: string[];
  slots: CapabilityPackSlot[];
  missingSlots: CapabilityPackSlotKey[];
  qualityScore: number;
  usageCount: number;
  lastUsedAt?: number;
  source: 'local' | 'agent' | 'import' | 'market';
  version: number;
  createdAt: number;
  updatedAt: number;
}

export type MarketItemType = 'asset' | 'capability_pack' | 'bundle';

export type MarketCategory =
  | 'prompting'
  | 'skill'
  | 'workflow'
  | 'tooling'
  | 'evaluation'
  | 'policy'
  | 'reference'
  | 'productivity'
  | 'local';

export type MarketConflictStrategy = 'overwrite' | 'duplicate' | 'skip';

export interface MarketItemPayload {
  asset?: PromptAsset;
  pack?: CapabilityPack;
  assets?: PromptAsset[];
}

export type MarketAuditStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type MarketPaymentMode = 'free' | 'paid_placeholder';

export interface MarketReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface MarketItem {
  id: string;
  itemType: MarketItemType;
  category: MarketCategory;
  title: string;
  summary: string;
  author: string;
  scenario: string;
  tags: string[];
  assetTypes: AssetType[];
  capabilityStatus: CapabilityStatus;
  includedAssetIds: string[];
  payload: MarketItemPayload;
  safetyNotes: string[];
  downloads: number;
  rating: number;
  auditStatus?: MarketAuditStatus;
  reviews?: MarketReview[];
  paymentMode?: MarketPaymentMode;
  priceCents?: number;
  license?: string;
  version: number;
  source: 'local' | 'import' | 'remote';
  createdAt: number;
  updatedAt: number;
}

export interface MarketInstallResult {
  ok: boolean;
  installedAssetIds: string[];
  installedPackIds: string[];
  overwrittenIds: string[];
  duplicatedIds: string[];
  skippedIds: string[];
  warnings: string[];
  message: string;
}

export type CompileMode = 'readable' | 'strict' | 'tool-ready' | 'agent-ready' | 'eval-ready';

export interface TaskModel {
  id: string;
  rawInput: string;
  goal: string;
  audience: string;
  scenario: string;
  inputMaterials: string[];
  expectedOutputs: string[];
  constraints: string[];
  risks: string[];
  missingInfo: string[];
  suggestedAssetTypes: AssetType[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  createdAt: number;
}

export interface AssetSlot {
  id: string;
  name: string;
  description: string;
  acceptedTypes: AssetType[];
  assetIds: string[];
  required: boolean;
  warnings: string[];
}

export interface PromptIR {
  task: TaskModel;
  sections: {
    role: string;
    context: string[];
    inputs: string[];
    process: string[];
    toolRules: string[];
    constraints: string[];
    outputFormat: string;
    evaluationCriteria: string[];
    fallback: string[];
  };
  assetBindings: {
    assetId: string;
    assetTitle: string;
    slot: string;
    appliedToSections: string[];
    priority: number;
  }[];
  risks: string[];
  assumptions: string[];
}

export interface PromptCompilation {
  id: string;
  taskId: string;
  mode: CompileMode;
  promptIR: PromptIR;
  compiledPrompt: string;
  assetIds: string[];
  warnings: string[];
  createdAt: number;
}

export type FeedbackEventType =
  | 'manual_edit'
  | 'copy_result'
  | 'save_result'
  | 'submit_result'
  | 'regenerate'
  | 'follow_up'
  | 'switch_prompt'
  | 'switch_model'
  | 'add_attachment'
  | 'delete_output_fragment'
  | 'mark_reusable'
  | 'create_asset_from_run';

export interface FeedbackEvent {
  id: string;
  runId: string;
  type: FeedbackEventType;
  label: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export type PatchTargetKind = 'asset' | 'capability_pack';
export type PatchReviewStatus = 'pending' | 'accepted' | 'rejected' | 'snoozed';

export interface AssetPatch {
  id: string;
  targetKind?: PatchTargetKind;
  targetAssetId?: string;
  targetAssetTitle?: string;
  targetPackId?: string;
  targetPackTitle?: string;
  status?: PatchReviewStatus;
  suggestedAssetType: AssetType;
  reason: string;
  evidenceEvents: string[];
  changes: {
    fieldPath: string;
    before: string;
    after: string;
  }[];
  expectedImpact: string;
  risk: string;
  source?: string;
  reviewedAt?: number;
  createdAt: number;
}

export interface PromptRun {
  id: string;
  compilationId: string;
  model: string;
  input: string;
  output: string;
  metrics: Record<string, number>;
  feedbackEvents: FeedbackEvent[];
  status?: 'preview_only' | 'completed' | 'missing_provider_config' | 'failed';
  provider?: string;
  error?: string;
  createdAt: number;
}

export interface AssetGraphEdge {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  relation:
    | 'uses'
    | 'evaluates'
    | 'constrains'
    | 'provides_context'
    | 'implements'
    | 'tests'
    | 'derived_from'
    | 'conflicts_with';
  note: string;
}

export interface AssetBuilderDraft {
  id: string;
  assetType: AssetType;
  title: string;
  summary: string;
  content: string;
  integration: AssetIntegration;
  schemaPreview: string[];
  nextSteps: string[];
  warnings: string[];
  createdAt: number;
}

export interface RunLabComparisonMetric {
  promptLength: number;
  assetCount: number;
  sectionCount: number;
  warningCount: number;
}

export interface RunLabComparison {
  id: string;
  taskId: string;
  baselinePrompt: string;
  variantPrompt: string;
  baselineMetrics: RunLabComparisonMetric;
  variantMetrics: RunLabComparisonMetric;
  differences: string[];
  recommendation: string;
  createdAt: number;
}

export interface RunLabRunResult {
  id: string;
  compilationId: string;
  status: 'preview_only' | 'completed' | 'missing_provider_config' | 'failed';
  provider: string;
  model: string;
  input: string;
  output: string;
  metrics: Record<string, number>;
  message: string;
  createdAt: number;
}

export interface RunLabMultiRunResult {
  id: string;
  provider: string;
  models: string[];
  runs: RunLabRunResult[];
  summary: string;
  createdAt: number;
}

export interface EvaluatorResult {
  id: string;
  runId: string;
  evaluatorAssetId?: string;
  evaluatorTitle?: string;
  dimensions: string[];
  passThreshold: string;
  scores: Record<string, number>;
  summary: string;
  issues?: string[];
  recommendations?: string[];
  unavailableReason?: string;
  createdAt: number;
}

export interface BuilderChatResponse {
  ok: boolean;
  status: 'completed' | 'missing_provider_config' | 'failed';
  provider: string;
  model: string;
  reply: string;
  suggestedAssetType?: AssetType;
  draft?: AssetBuilderDraft;
  missingFields?: string[];
  suggestedActions?: string[];
  message: string;
}

export interface ToolAdapterSummary {
  id: string;
  label: string;
  assetTypes: AssetType[];
  capability: string;
  inputHint: string;
  risk: 'low' | 'medium' | 'high';
  enabled?: boolean;
}

export interface ToolExecutionResult {
  ok: boolean;
  status: 'completed' | 'blocked' | 'requires_confirmation' | 'adapter_missing' | 'failed';
  adapterId?: string;
  mode: CapabilityStatus | 'dry_run';
  message: string;
  output?: unknown;
  dryRun?: unknown;
  riskNotes: string[];
  startedAt: number;
  completedAt: number;
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'reviewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'invited' | 'disabled';
  joinedAt: number;
}

export interface TeamSpace {
  id: string;
  name: string;
  summary: string;
  members: TeamMember[];
  assetIds: string[];
  packIds: string[];
  internalMarketEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ApprovalRequest {
  id: string;
  teamId: string;
  targetKind: 'asset' | 'capability_pack' | 'market_item';
  targetId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  reviewedBy?: string;
  comment?: string;
  createdAt: number;
  reviewedAt?: number;
}

export interface OnlineExperiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    id: string;
    name: string;
    promptId?: string;
    compilationId?: string;
    weight: number;
  }[];
  metrics: string[];
  events: {
    id: string;
    variantId: string;
    metric: string;
    value: number;
    timestamp: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface BenchmarkRun {
  id: string;
  targetType: 'baseline' | 'assets' | 'capability_pack';
  packId?: string;
  packTitle?: string;
  assetIds: string[];
  input: string;
  expectedOutput: string;
  actualOutput: string;
  metrics: Record<string, number | string>;
  compilationId?: string;
  runId?: string;
  createdAt: number;
}

export interface FeedbackInsights {
  totalEvents: number;
  patchCount: number;
  patchTypes: Record<string, number>;
  topSignals: string[];
  nextActions: string[];
  riskNotes: string[];
  createdAt: number;
}

export interface DocsIndexItem {
  path: string;
  title: string;
  category: 'product' | 'knowledge' | 'asset-spec' | 'plan' | 'other';
  summary: string;
  updatedAt: number;
}

export interface BackendHealth {
  ok: boolean;
  service: string;
  version: string;
  docsCount: number;
  dataDirReady: boolean;
  timestamp: number;
}

export type RuntimeConfigState = 'configured' | 'missing_provider_config' | 'unconfigured' | 'unknown';

export type MarketMode = 'local' | 'remote' | 'disabled' | 'unknown';

export type ImportSourceKind = 'file' | 'json' | 'external-url' | 'market' | 'local' | 'unknown';

export interface CapabilityProviderStatus {
  provider: string;
  configured: boolean;
  status: CapabilityStatus;
  configState: RuntimeConfigState;
  message: string;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  tlsRejectUnauthorized?: boolean;
}

export interface RuntimeStateStatus {
  ok: boolean;
  mode: 'backend_json' | 'local_storage_fallback' | 'unavailable';
  dataDirReady: boolean;
  collections: string[];
  localStorageKeys: string[];
  message: string;
}

export interface MarketRuntimeStatus {
  mode: MarketMode;
  configured: boolean;
  status: CapabilityStatus;
  message: string;
  remoteAccountConfigured: boolean;
}

export interface ImportRuntimeStatus {
  supportedSources: ImportSourceKind[];
  executableSources: ImportSourceKind[];
  defaultStatusForExecutableAssets: CapabilityStatus;
  message: string;
}

export interface ToolingRuntimeStatus {
  type: 'mcp' | 'sdk' | 'tool' | 'connector';
  status: CapabilityStatus;
  configured: boolean;
  executable: boolean;
  requiresConfirmation: boolean;
  message: string;
}

export interface ExecutionGateStatus {
  modelExecutionAllowed: boolean;
  toolExecutionAllowed: boolean;
  requiresExplicitConfirmation: boolean;
  adapterAllowlist?: string[];
  missingConfiguration: string[];
  message: string;
}

export interface CapabilityCheck {
  backend: {
    ok: boolean;
    stateCollections: string[];
    apiBaseUrl?: string;
    state?: RuntimeStateStatus;
  };
  model: CapabilityProviderStatus;
  assets: {
    mcp: CapabilityStatus;
    sdk: CapabilityStatus;
    tool: CapabilityStatus;
    connector: CapabilityStatus;
  };
  market?: MarketRuntimeStatus;
  imports?: ImportRuntimeStatus;
  tooling?: {
    mcp: ToolingRuntimeStatus;
    sdk: ToolingRuntimeStatus;
    tool: ToolingRuntimeStatus;
    connector: ToolingRuntimeStatus;
  };
  adapters?: ToolAdapterSummary[];
  collaboration?: {
    status: CapabilityStatus;
    collections: string[];
    message: string;
  };
  experiments?: {
    status: CapabilityStatus;
    collections: string[];
    message: string;
  };
  execution?: ExecutionGateStatus;
  timestamp: number;
}

export interface AssetPatchApplyResult {
  ok: boolean;
  asset?: PromptAsset;
  patchId: string;
  appliedAt: number;
  message: string;
}

export interface ArchitectureManifest {
  name: string;
  stack: {
    frontend: string;
    backend: string;
    docs: string;
    storage: string;
  };
  boundaries: string[];
  endpoints: string[];
}

export interface OptimizationDirection {
  id: string;
  name: string;
  description: string;
  builtIn?: boolean;
}

export interface Attachment {
  id: string;
  data: string;
  mimeType: string;
  name: string;
  type: 'image' | 'pdf' | 'word' | 'excel' | 'markdown' | 'text' | 'json' | 'other';
  textContent?: string;
}

export interface PromptVersion {
  id: string;
  timestamp: number;
  optimized: string;
  highlights: string[];
  suggestions: string[]; // 新增：动态生成的专家建议
  groundingUrls?: string[];
  settings: {
    scenario: ScenarioType;
    style: StyleMode;
    useThinking: boolean;
    useSearch: boolean;
    directions?: string[];
    customDirection?: string;
    selectedAssetIds?: string[];
  };
}

export interface ABTestMetric {
  id: string;
  name: string;
  type: 'score' | 'keyword' | 'custom';
  description?: string;
  keywords?: string[];
}

export interface ABTestResultItem {
  versionId: string;
  versionIndex: number;
  promptContent: string;
  output: string;
  scores: Record<string, number>;
  keywordMatches: Record<string, boolean>;
  evaluation: string;
}

export interface ABTestReport {
  id: string;
  timestamp: number;
  testInput: string;
  metrics: ABTestMetric[];
  results: ABTestResultItem[];
  summary: string;
}

export interface HistoryEntry {
  id: string;
  originalInput: string;
  versions: PromptVersion[];
  abTestReports?: ABTestReport[];
  lastModified: number;
}

export interface OptimizationResult {
  original: string;
  optimized: string;
  highlights: string[];
  suggestions: string[]; // 新增
  groundingUrls?: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
