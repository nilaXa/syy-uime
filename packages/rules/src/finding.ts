import type { Dimension, Finding, Severity, Evidence } from '@syy-uime/core';
import { generateId } from '@syy-uime/core';

export interface FindingInput {
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
  evidence?: Evidence[];
  screenshot?: string;
  confidence?: number;
}

export function createFinding(input: FindingInput): Finding {
  return {
    id: generateId('finding'),
    ruleId: input.ruleId,
    dimension: input.dimension,
    severity: input.severity,
    page: input.page,
    url: input.url,
    selector: input.selector,
    elementDescription: input.elementDescription,
    message: input.message,
    expected: input.expected,
    actual: input.actual,
    evidence: input.evidence ?? [],
    screenshot: input.screenshot,
    confidence: input.confidence ?? 1,
  };
}
