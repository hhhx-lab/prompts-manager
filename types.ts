
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
  createdAt: number;
  updatedAt: number;
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
