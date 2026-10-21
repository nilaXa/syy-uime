import { GoogleGenAI } from '@google/genai';
import type { Assessment, LlmAnalysis } from '@syy-uime/core';

const DEFAULT_MODEL = 'gemini-2.5-flash';

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

  async analyze(assessment: Assessment): Promise<LlmAnalysis | undefined> {
    if (!this.options.enabled) return undefined;

    const apiKey = this.options.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Gemini analysis is enabled but no API key was provided. Set GEMINI_API_KEY or pass apiKey.',
      );
    }

    const model = this.options.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildPrompt(assessment);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text ?? '';
    return parseResponse(text);
  }
}

function buildPrompt(assessment: Assessment): string {
  return `You are a senior UI quality analyst reviewing a deterministic assessment of a web application.

CRITICAL INSTRUCTIONS:
- Base your analysis ONLY on the supplied findings in the assessment JSON below.
- NEVER invent failures, bugs, or issues that are not explicitly present in the findings.
- Distinguish observation from inference; explain likely root causes only as hypotheses.
- Cite finding IDs when referring to specific issues.
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
${JSON.stringify(assessment, null, 2)}
`;
}

export function parseResponse(text: string): LlmAnalysis {
  const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);

  return parsed as LlmAnalysis;
}
