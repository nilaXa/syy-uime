import type { Rule, RuleContext, RuleResult, Evidence, Finding, StyleFingerprint, StyleCollection } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import { groupByFingerprint, findOutliers } from './fingerprint.js';

export const typographyRule: Rule = {
  id: 'typography-variation',
  dimension: 'consistent',
  requiredEvidence: ['computed-style'],
  execute(context: RuleContext): RuleResult {
    const styleEvidence = context.evidence.filter(
      (e) => e.type === 'computed-style',
    ) as Evidence<StyleCollection>[];

    const findings: Finding[] = [];

    for (const evidence of styleEvidence) {
      const headings = evidence.data.entries.filter((entry) =>
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(entry.tag),
      );

      if (headings.length < 2) continue;

      const byTag = new Map<string, { selector: string; fingerprint: StyleFingerprint }[]>();
      for (const entry of headings) {
        const list = byTag.get(entry.tag) ?? [];
        list.push({ selector: entry.selector, fingerprint: entry.fingerprint });
        byTag.set(entry.tag, list);
      }

      for (const [tag, entries] of byTag) {
        const groups = groupByFingerprint(entries, ['fontFamily', 'fontSize', 'fontWeight', 'color']);
        const outliers = findOutliers(groups, 2);
        for (const outlier of outliers) {
          findings.push(
            createFinding({
              ruleId: 'typography-variation',
              dimension: 'consistent',
              severity: 'minor',
              page: context.page,
              url: context.url,
              selector: outlier.selectors.slice(0, 3).join(', '),
              message: `Inconsistent ${tag.toUpperCase()} typography detected (${outlier.count} of ${entries.length}): ${JSON.stringify(outlier.fingerprint)}`,
              expected: `Consistent ${tag.toUpperCase()} font properties`,
              actual: outlier.fingerprint,
              evidence: [evidence],
            }),
          );
        }
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
