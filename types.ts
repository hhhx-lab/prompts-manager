
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
