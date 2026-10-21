import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { StyleCollection } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import { groupByFingerprint, findOutliers } from './fingerprint.js';

export const buttonStyleRule: Rule = {
  id: 'button-style-variation',
  dimension: 'consistent',
  requiredEvidence: ['computed-style'],
  execute(context: RuleContext): RuleResult {
    const styleEvidence = context.evidence.filter(
      (e) => e.type === 'computed-style',
    ) as Evidence<StyleCollection>[];

    const findings: Finding[] = [];

    for (const evidence of styleEvidence) {
      const buttons = evidence.data.entries.filter(
        (entry) => entry.tag === 'button' || entry.role === 'button',
      );

      if (buttons.length < 3) continue;

      const groups = groupByFingerprint(
        buttons.map((b) => ({ selector: b.selector, fingerprint: b.fingerprint })),
        ['height', 'borderRadius', 'fontSize', 'padding'],
      );

      const outliers = findOutliers(groups, 2);

      for (const outlier of outliers) {
        const sample = outlier.selectors.slice(0, 3).join(', ');
        findings.push(
          createFinding({
            ruleId: 'button-style-variation',
            dimension: 'consistent',
            severity: 'major',
            page: context.page,
            url: context.url,
            selector: sample,
            message: `Button style outlier detected (${outlier.count} of ${buttons.length} buttons): ${JSON.stringify(outlier.fingerprint)}`,
            expected: 'Consistent button dimensions and radius',
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
