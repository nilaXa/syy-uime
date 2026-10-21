import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { DomSnapshot } from '@syy-uime/core';
import { createFinding } from '../finding.js';

export const semanticStructureRule: Rule = {
  id: 'semantic-structure',
  dimension: 'accessible',
  requiredEvidence: ['dom'],
  execute(context: RuleContext): RuleResult {
    const domEvidence = context.evidence.find((e) => e.type === 'dom') as Evidence<DomSnapshot> | undefined;
    const findings: Finding[] = [];

    if (!domEvidence) {
      return { findings, checksRun: 0, checksPassed: 0, checksFailed: 0 };
    }

    const data = domEvidence.data;

    if (data.headingCount === 0) {
      findings.push(
        createFinding({
          ruleId: 'semantic-structure',
          dimension: 'accessible',
          severity: 'major',
          page: context.page,
          url: context.url,
          message: 'No heading elements found on the page.',
          evidence: [domEvidence],
        }),
      );
    }

    if (data.landmarkCount === 0) {
      findings.push(
        createFinding({
          ruleId: 'semantic-structure',
          dimension: 'accessible',
          severity: 'minor',
          page: context.page,
          url: context.url,
          message: 'No landmark elements or ARIA landmarks found.',
          evidence: [domEvidence],
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
