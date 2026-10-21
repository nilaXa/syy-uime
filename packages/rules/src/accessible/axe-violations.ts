import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { AxeResultEntry } from '@syy-uime/core';
import { createFinding } from '../finding.js';

const impactToSeverity: Record<string, 'blocker' | 'critical' | 'major' | 'minor'> = {
  critical: 'critical',
  serious: 'major',
  moderate: 'minor',
  minor: 'minor',
};

export const axeViolationsRule: Rule = {
  id: 'axe-violations',
  dimension: 'accessible',
  requiredEvidence: ['axe'],
  execute(context: RuleContext): RuleResult {
    const axeEvidence = context.evidence.filter((e) => e.type === 'axe') as Evidence<AxeResultEntry[]>[];
    const findings: Finding[] = [];
    let checksFailed = 0;

    for (const evidence of axeEvidence) {
      const entries = evidence.data ?? [];
      for (const violation of entries) {
        checksFailed++;
        const severity = impactToSeverity[violation.impact ?? 'minor'] ?? 'minor';
        const selector = violation.nodes.map((n) => n.target.join(' ')).join(', ');

        findings.push(
          createFinding({
            ruleId: 'axe-violations',
            dimension: 'accessible',
            severity,
            page: context.page,
            url: context.url,
            selector,
            message: `${violation.description} (Axe rule ${violation.ruleId})`,
            actual: violation,
            evidence: [evidence],
          }),
        );
      }
    }

    return {
      findings,
      checksRun: axeEvidence.length,
      checksPassed: axeEvidence.length - checksFailed,
      checksFailed,
    };
  },
};
