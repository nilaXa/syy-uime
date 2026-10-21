export type Dimension = 'functional' | 'consistent' | 'accessible' | 'responsive';

export const DIMENSIONS: Dimension[] = ['functional', 'consistent', 'accessible', 'responsive'];

export type Severity = 'blocker' | 'critical' | 'major' | 'minor' | 'info';

export const SEVERITIES: Severity[] = ['blocker', 'critical', 'major', 'minor', 'info'];

export type EvidenceType =
  | 'dom'
  | 'computed-style'
  | 'screenshot'
  | 'axe'
  | 'console'
  | 'network'
  | 'geometry'
  | 'journey-step'
  | 'keyboard'
  | 'semantic'
  | 'style-fingerprint';

export interface Evidence<T = unknown> {
  type: EvidenceType;
  data: T;
}

export interface Finding {
  id: string;
  ruleId: string;
  dimension: Dimension;
  severity: Severity;
  page: string;
  url: string;
  selector?: string;
  elementDescription?: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
  evidence: Evidence[];
  screenshot?: string;
  confidence: number;
}

export interface DimensionAssessment {
  dimension: Dimension;
  score: number;
  confidence: number;
  checksRun: number;
  checksPassed: number;
  checksFailed: number;
  findings: Finding[];
  coverageNotes: string[];
}

export interface CoverageSummary {
  pagesAssessed: number;
  routesConfigured: number;
  viewports: number;
  screenshotsCaptured: number;
  journeysConfigured: number;
  journeysExecuted: number;
}

export interface AnalysisItem {
  title: string;
  description: string;
  findingIds: string[];
}

export interface Recommendation {
  priority: Severity;
  title: string;
  description: string;
  dimension: Dimension;
  findingIds: string[];
}

export interface Pattern {
  title: string;
  explanation: string;
  relatedFindingIds: string[];
}

export interface LlmAnalysis {
  executiveSummary: string;
  strengths: AnalysisItem[];
  gaps: AnalysisItem[];
  recommendations: Recommendation[];
  patterns: Pattern[];
}

export interface ProjectMetadata {
  name: string;
  baseUrl: string;
}

export interface Assessment {
  id: string;
  project: ProjectMetadata;
  startedAt: string;
  completedAt: string;
  dimensions: Record<Dimension, DimensionAssessment>;
  overallScore: number;
  overallConfidence: number;
  coverage: CoverageSummary;
  llmAnalysis?: LlmAnalysis;
}

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface JourneyStep {
  action: 'fill' | 'click' | 'assert-visible' | 'assert-text' | 'press' | 'navigate' | 'select' | 'hover';
  selector?: string;
  value?: string;
  key?: string;
  text?: string;
}

export interface JourneyConfig {
  name: string;
  start: string;
  steps: JourneyStep[];
}

export interface ThresholdConfig {
  overall?: number;
  functional?: number;
  consistent?: number;
  accessible?: number;
  responsive?: number;
}

export interface DimensionToggleConfig {
  functional?: boolean;
  consistent?: boolean;
  accessible?: boolean;
  responsive?: boolean;
}

export interface AuthenticationConfig {
  storageState?: string;
}

export interface LlmConfig {
  enabled?: boolean;
}

export interface AssessmentConfig {
  project: { name: string };
  target: { baseUrl: string };
  authentication?: AuthenticationConfig;
  routes: string[];
  viewports: ViewportConfig[];
  dimensions?: DimensionToggleConfig;
  thresholds?: ThresholdConfig;
  journeys?: JourneyConfig[];
  llm?: LlmConfig;
}

export interface AssessmentOptions {
  configPath?: string;
  url?: string;
  output?: string;
  noLlm?: boolean;
  headed?: boolean;
  debug?: boolean;
  dimensions?: Dimension[];
}

export interface CollectorContext {
  page: string;
  url: string;
  viewport: ViewportConfig;
  runId: string;
  outputDir: string;
}

export interface EvidenceCollection {
  evidence: Evidence[];
  screenshots: string[];
}

export interface EvidenceProvider {
  id: string;
  collect(context: AssessmentContext): Promise<EvidenceCollection>;
}

export interface AssessmentContext {
  config: AssessmentConfig;
  options: AssessmentOptions;
  runId: string;
  outputDir: string;
  browserName?: string;
}

export interface RuleContext {
  page: string;
  url: string;
  viewport: ViewportConfig;
  evidence: Evidence[];
  screenshots: string[];
  config: AssessmentConfig;
}

export interface RuleResult {
  findings: Finding[];
  checksRun: number;
  checksPassed: number;
  checksFailed: number;
}

export interface Rule {
  id: string;
  dimension: Dimension;
  requiredEvidence: EvidenceType[];
  execute(context: RuleContext): RuleResult | Promise<RuleResult>;
}

export interface StyleFingerprint {
  tag: string;
  role?: string;
  accessibleRole?: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  color: string;
  backgroundColor: string;
  border: string;
  borderRadius: string;
  padding: string;
  margin: string;
  gap: string;
  width: string;
  height: string;
  boxShadow: string;
  outline: string;
  outlineOffset: string;
}

export interface ElementGeometry {
  selector: string;
  tag: string;
  role?: string;
  accessibleName?: string;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  overflowX: string;
  overflowY: string;
  visible: boolean;
}

export interface DocumentGeometry {
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  hasHorizontalOverflow: boolean;
}

export interface GeometryCollection {
  page: string;
  viewport: string;
  document: DocumentGeometry;
  elements: ElementGeometry[];
}

export interface ComputedStyleEntry {
  selector: string;
  tag: string;
  role?: string;
  accessibleRole?: string;
  fingerprint: StyleFingerprint;
}

export interface StyleCollection {
  page: string;
  viewport: string;
  entries: ComputedStyleEntry[];
}

export interface DomSnapshot {
  page: string;
  url: string;
  viewport: string;
  title: string;
  headingCount: number;
  linkCount: number;
  buttonCount: number;
  inputCount: number;
  landmarkCount: number;
  lang?: string;
}

export interface AxeResultEntry {
  ruleId: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    target: string[];
    html: string;
    failureSummary?: string;
  }[];
  page: string;
  viewport: string;
}

export interface KeyboardFlowResult {
  page: string;
  viewport: string;
  initialFocusable: number;
  reachedElements: string[];
  focusTrapped: boolean;
  focusReturned: boolean;
  escapeWorked: boolean;
  notes: string[];
}

export interface JourneyStepResult {
  action: string;
  selector?: string;
  value?: string;
  text?: string;
  key?: string;
  success: boolean;
  message: string;
  timestamp: string;
}

export interface JourneyResult {
  name: string;
  start: string;
  success: boolean;
  steps: JourneyStepResult[];
  error?: string;
}
