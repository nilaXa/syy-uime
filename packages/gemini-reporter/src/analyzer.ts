import { GoogleGenAI } from '@google/genai';
import type { Assessment, Dimension, LlmAnalysis, Severity } from '@syy-uime/core';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const MAX_FINDINGS_IN_PROMPT = 150;
const SEVERITIES: Severity[] = ['blocker', 'critical', 'major', 'minor', 'info'];
const DIMENSIONS: Dimension[] = ['functional', 'consistent', 'accessible', 'responsive'];

export interface GeminiAnalyzerOptions {
  apiKey?: string;
  model?: string;
  enabled: boolean;
}

export class GeminiAnalyzer {
  private options: GeminiAnalyzerOptions;

  constructor(options: GeminiAnalyzerOptions) {
    this.options = options;
  }

  get model(): string {
    return this.options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  }

  async analyze(assessment: Assessment): Promise<LlmAnalysis | undefined> {
    if (!this.options.enabled) return undefined;

    const apiKey = this.options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini analysis is enabled but GEMINI_API_KEY is not set (check your .env file).');
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models
      .generateContent({
        model: this.model,
        contents: buildPrompt(assessment),
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })
      .catch((err: unknown) => {
        throw new Error(`Gemini request failed (model "${this.model}"): ${describeApiError(err)}`);
      });

    const text = response.text;
    if (!text) throw new Error(`Gemini model "${this.model}" returned an empty response.`);
    return parseResponse(text);
  }
}

export function buildPromptPayload(assessment: Assessment): unknown {
  const findings = Object.values(assessment.dimensions)
    .flatMap((d) => d.findings)
    .sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity))
    .slice(0, MAX_FINDINGS_IN_PROMPT)
    .map((f) => ({
      id: f.id,
      ruleId: f.ruleId,
      dimension: f.dimension,
      severity: f.severity,
      page: f.page,
      selector: f.selector,
      message: f.message,
      evidenceTypes: [...new Set(f.evidence.map((e) => e.type))],
    }));

  return {
    project: assessment.project,
    overallScore: assessment.overallScore,
    overallConfidence: assessment.overallConfidence,
    coverage: assessment.coverage,
    dimensions: Object.fromEntries(
      Object.entries(assessment.dimensions).map(([name, d]) => [
        name,
        {
          score: d.score,
          confidence: d.confidence,
          checksRun: d.checksRun,
          checksFailed: d.checksFailed,
          coverageNotes: d.coverageNotes,
        },
      ]),
    ),
    findings,
  };
}

function buildPrompt(assessment: Assessment): string {
  return `You are a senior UI quality analyst reviewing a deterministic assessment of a web application.

CRITICAL INSTRUCTIONS:
- Base your analysis ONLY on the supplied findings in the assessment JSON below.
- NEVER invent failures, bugs, or issues that are not explicitly present in the findings.
- Scores were computed deterministically; do not re-score or decide pass/fail.
- Distinguish observation from inference; explain likely root causes only as hypotheses.
- Cite finding IDs (findingIds / relatedFindingIds) when referring to specific issues.
- Prioritize blocker and critical severity issues.
- Aggregate duplicate symptoms into patterns where appropriate.
- Provide actionable engineering recommendations relevant to the affected dimension.

Respond with a single JSON object matching this TypeScript type:

interface LlmAnalysis {
  executiveSummary: string;
  strengths: { title: string; description: string; findingIds: string[] }[];
  gaps: { title: string; description: string; findingIds: string[] }[];
  recommendations: { priority: "blocker" | "critical" | "major" | "minor" | "info"; title: string; description: string; dimension: "functional" | "consistent" | "accessible" | "responsive"; findingIds: string[] }[];
  patterns: { title: string; explanation: string; relatedFindingIds: string[] }[];
}

ASSESSMENT JSON:
${JSON.stringify(buildPromptPayload(assessment), null, 2)}
`;
}

export function parseResponse(text: string): LlmAnalysis {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const raw = JSON.parse(cleaned) as Record<string, unknown>;

  const items = (value: unknown) =>
    asArray(value).map((i) => ({
      title: asString(i.title),
      description: asString(i.description),
      findingIds: asStringArray(i.findingIds),
    }));

  return {
    executiveSummary: asString(raw.executiveSummary),
    strengths: items(raw.strengths),
    gaps: items(raw.gaps),
    recommendations: asArray(raw.recommendations).map((r) => ({
      priority: SEVERITIES.includes(r.priority as Severity) ? (r.priority as Severity) : 'info',
      title: asString(r.title),
      description: asString(r.description),
      dimension: DIMENSIONS.includes(r.dimension as Dimension) ? (r.dimension as Dimension) : 'functional',
      findingIds: asStringArray(r.findingIds),
    })),
    patterns: asArray(raw.patterns).map((p) => ({
      title: asString(p.title),
      explanation: asString(p.explanation),
      relatedFindingIds: asStringArray(p.relatedFindingIds),
    })),
  };
}

export function describeApiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const json = message.slice(message.indexOf('{'));
  try {
    const parsed = JSON.parse(json) as { error?: { message?: string; status?: string } };
    if (parsed.error?.message) return [parsed.error.status, parsed.error.message].filter(Boolean).join(': ');
  } catch {
    // not a JSON error payload
  }
  return message;
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object') : [];
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}
