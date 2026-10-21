import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import type { JourneyResult } from '@syy-uime/core';

export const journeyExecutionRule: Rule = {
  id: 'journey-execution',
  dimension: 'functional',
  requiredEvidence: ['journey-step'],
  execute(context: RuleContext): RuleResult {
    const journeyEvidence = context.evidence.filter(
      (e) => e.type === 'journey-step',
    ) as Evidence<JourneyResult>[];

    const findings: Finding[] = [];
    let checksFailed = 0;

    for (const evidence of journeyEvidence) {
      const journey = evidence.data;
      if (journey.success) continue;

      checksFailed++;
      const failedStep = journey.steps.find((s) => !s.success);
      findings.push(
        createFinding({
          ruleId: 'journey-execution',
          dimension: 'functional',
          severity: 'critical',
          page: journey.start,
          url: context.url,
          selector: failedStep?.selector,
          message: `Journey "${journey.name}" failed: ${failedStep?.message ?? journey.error ?? 'unknown error'}`,
          actual: journey,
          evidence: [evidence],
        }),
      );
    }

    return {
      findings,
      checksRun: journeyEvidence.length,
      checksPassed: journeyEvidence.length - checksFailed,
      checksFailed,
    };
  },
};
