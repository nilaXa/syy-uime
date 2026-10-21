import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import type { NetworkEntry } from './network-failures.js';
import type { DomSnapshot } from '@syy-uime/core';

export const brokenNavigationRule: Rule = {
  id: 'broken-navigation',
  dimension: 'functional',
  requiredEvidence: ['network'],
  execute(context: RuleContext): RuleResult {
    const networkEvidence = context.evidence.filter((e) => e.type === 'network') as Evidence<NetworkEntry[]>[];
    const findings: Finding[] = [];
    let checksFailed = 0;

    const domEvidence = context.evidence.find((e) => e.type === 'dom') as Evidence<DomSnapshot> | undefined;
    const title = domEvidence?.data?.title ?? '';

    for (const evidence of networkEvidence) {
      const entries = evidence.data ?? [];
      for (const entry of entries) {
        if (!entry.sameOrigin) continue;
        if (entry.status >= 400 && entry.status < 500) {
          checksFailed++;
          findings.push(
            createFinding({
              ruleId: 'broken-navigation',
              dimension: 'functional',
              severity: 'blocker',
              page: context.page,
              url: context.url,
              message: `Navigation returned ${entry.status} ${entry.statusText} for ${entry.url}`,
              actual: entry,
              evidence: [evidence, ...(domEvidence ? [domEvidence] : [])],
            }),
          );
        }
      }
    }

    if (title.toLowerCase().includes('404') || title.toLowerCase().includes('not found')) {
      checksFailed++;
      findings.push(
        createFinding({
          ruleId: 'broken-navigation',
          dimension: 'functional',
          severity: 'blocker',
          page: context.page,
          url: context.url,
          message: `Page title suggests a 404/error response: "${title}"`,
          actual: title,
          evidence: domEvidence ? [domEvidence] : [],
        }),
      );
    }

    return {
      findings,
      checksRun: 1,
      checksPassed: checksFailed === 0 ? 1 : 0,
      checksFailed,
    };
  },
};
