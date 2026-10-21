import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { GeometryCollection } from '@syy-uime/core';
import { createFinding } from '../finding.js';

export const documentOverflowRule: Rule = {
  id: 'document-overflow',
  dimension: 'responsive',
  requiredEvidence: ['geometry'],
  execute(context: RuleContext): RuleResult {
    const geometryEvidence = context.evidence.find((e) => e.type === 'geometry') as
      | Evidence<GeometryCollection>
      | undefined;

    const findings: Finding[] = [];

    if (!geometryEvidence) {
      return { findings, checksRun: 0, checksPassed: 0, checksFailed: 0 };
    }

    const screenshot = context.screenshots[0];
    const doc = geometryEvidence.data.document;

    if (doc.hasHorizontalOverflow) {
      findings.push(
        createFinding({
          ruleId: 'document-overflow',
          dimension: 'responsive',
          severity: 'major',
          page: context.page,
          url: context.url,
          message: `Document horizontal overflow detected: scrollWidth (${doc.scrollWidth}px) exceeds clientWidth (${doc.clientWidth}px) at ${context.viewport.width}px viewport.`,
          actual: doc,
          evidence: [geometryEvidence],
          screenshot,
        }),
      );
    }

    return {
      findings,
      checksRun: 1,
      checksPassed: findings.length === 0 ? 1 : 0,
      checksFailed: findings.length,
    };
  },
};
