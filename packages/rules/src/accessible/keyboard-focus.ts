import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { KeyboardFlowResult } from '@syy-uime/core';
import { createFinding } from '../finding.js';

export const keyboardFocusRule: Rule = {
  id: 'keyboard-focus',
  dimension: 'accessible',
  requiredEvidence: ['keyboard'],
  execute(context: RuleContext): RuleResult {
    const keyboardEvidence = context.evidence.filter(
      (e) => e.type === 'keyboard',
    ) as Evidence<KeyboardFlowResult>[];

    const findings: Finding[] = [];

    for (const evidence of keyboardEvidence) {
      const data = evidence.data;

      if (data.initialFocusable > 0 && data.reachedElements.length === 0) {
        findings.push(
          createFinding({
            ruleId: 'keyboard-focus',
            dimension: 'accessible',
            severity: 'critical',
            page: context.page,
            url: context.url,
            message: 'Interactive elements are present but Tab navigation did not reach any element.',
            actual: data,
            evidence: [evidence],
          }),
        );
      }

      if (data.focusTrapped) {
        findings.push(
          createFinding({
            ruleId: 'keyboard-focus',
            dimension: 'accessible',
            severity: 'major',
            page: context.page,
            url: context.url,
            message: 'Potential keyboard focus trap detected.',
            actual: data,
            evidence: [evidence],
          }),
        );
      }
    }

    return {
      findings,
      checksRun: keyboardEvidence.length,
      checksPassed: keyboardEvidence.length - findings.length,
      checksFailed: findings.length,
    };
  },
};
