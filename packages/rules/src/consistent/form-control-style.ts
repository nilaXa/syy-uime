import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { StyleCollection } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import { groupByFingerprint, findOutliers } from './fingerprint.js';

export const formControlStyleRule: Rule = {
  id: 'form-control-variation',
  dimension: 'consistent',
  requiredEvidence: ['computed-style'],
  execute(context: RuleContext): RuleResult {
    const styleEvidence = context.evidence.filter(
      (e) => e.type === 'computed-style',
    ) as Evidence<StyleCollection>[];

    const findings: Finding[] = [];

    for (const evidence of styleEvidence) {
      const controls = evidence.data.entries.filter(
        (entry) => entry.tag === 'input' || entry.tag === 'select' || entry.tag === 'textarea',
      );

      if (controls.length < 3) continue;

      const groups = groupByFingerprint(
        controls.map((c) => ({ selector: c.selector, fingerprint: c.fingerprint })),
        ['height', 'borderRadius', 'border', 'padding'],
      );

      const outliers = findOutliers(groups, 2);

      for (const outlier of outliers) {
        const sample = outlier.selectors.slice(0, 3).join(', ');
        findings.push(
          createFinding({
            ruleId: 'form-control-variation',
            dimension: 'consistent',
            severity: 'major',
            page: context.page,
            url: context.url,
            selector: sample,
            message: `Form control style outlier detected (${outlier.count} of ${controls.length} controls): ${JSON.stringify(outlier.fingerprint)}`,
            expected: 'Consistent form control dimensions and borders',
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
