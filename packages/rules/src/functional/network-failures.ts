import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import { createFinding } from '../finding.js';

export interface NetworkEntry {
  url: string;
  method: string;
  status: number;
  statusText: string;
  failureText?: string;
  resourceType: string;
  sameOrigin: boolean;
  page: string;
}

export const networkFailuresRule: Rule = {
  id: 'network-failures',
  dimension: 'functional',
  requiredEvidence: ['network'],
  execute(context: RuleContext): RuleResult {
    const networkEvidence = context.evidence.filter((e) => e.type === 'network') as Evidence<NetworkEntry[]>[];
    const findings: Finding[] = [];
    let checksFailed = 0;

    for (const evidence of networkEvidence) {
      const entries = evidence.data ?? [];
      for (const entry of entries) {
        if (!entry.sameOrigin) continue;
        if (entry.resourceType === 'image' || entry.resourceType === 'font' || entry.resourceType === 'stylesheet')
          continue;

        checksFailed++;
        const severity = entry.status >= 500 ? 'critical' : 'major';
        findings.push(
          createFinding({
            ruleId: 'network-failures',
            dimension: 'functional',
            severity,
            page: entry.page || context.page,
            url: context.url,
            message: `Network request failed: ${entry.method} ${entry.url} → ${entry.status} ${entry.statusText}`,
            actual: entry,
            evidence: [evidence],
          }),
        );
      }
    }

    return {
      findings,
      checksRun: networkEvidence.length,
      checksPassed: networkEvidence.length - checksFailed,
      checksFailed,
    };
  },
};
