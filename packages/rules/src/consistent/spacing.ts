import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { StyleCollection } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import { groupByFingerprint, findOutliers } from './fingerprint.js';

export const spacingRule: Rule = {
  id: 'spacing-variation',
  dimension: 'consistent',
  requiredEvidence: ['computed-style'],
  execute(context: RuleContext): RuleResult {
    const styleEvidence = context.evidence.filter(
      (e) => e.type === 'computed-style',
    ) as Evidence<StyleCollection>[];

    const findings: Finding[] = [];

    for (const evidence of styleEvidence) {
      const cards = evidence.data.entries.filter(
        (entry) => entry.tag === 'div' && entry.selector.includes('card'),
      );

      if (cards.length < 2) continue;

      const groups = groupByFingerprint(
        cards.map((c) => ({ selector: c.selector, fingerprint: c.fingerprint })),
        ['padding', 'margin', 'gap'],
      );

      const outliers = findOutliers(groups, 2);

      for (const outlier of outliers) {
        findings.push(
          createFinding({
            ruleId: 'spacing-variation',
            dimension: 'consistent',
            severity: 'minor',
            page: context.page,
            url: context.url,
            selector: outlier.selectors.slice(0, 3).join(', '),
            message: `Inconsistent card spacing detected (${outlier.count} of ${cards.length}): ${JSON.stringify(outlier.fingerprint)}`,
            expected: 'Consistent card padding/margin/gap',
            actual: outlier.fingerprint,
            evidence: [evidence],
          }),
        );
      }
    }

    return {
      findings,
      checksRun: styleEvidence.length,
      checksPassed: styleEvidence.length - findings.length,
      checksFailed: findings.length,
    };
  },
};
