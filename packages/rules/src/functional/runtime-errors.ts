import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import { createFinding } from '../finding.js';

export interface ConsoleEntry {
  type: 'error' | 'warning' | 'log' | 'info';
  text: string;
  location: string;
  page: string;
  url: string;
}

export const runtimeErrorsRule: Rule = {
  id: 'runtime-errors',
  dimension: 'functional',
  requiredEvidence: ['console'],
  execute(context: RuleContext): RuleResult {
    const consoleEvidence = context.evidence.filter((e) => e.type === 'console') as Evidence<ConsoleEntry[]>[];
    const findings: Finding[] = [];
    let checksFailed = 0;

    for (const evidence of consoleEvidence) {
      const entries = evidence.data ?? [];
      for (const entry of entries) {
        if (entry.type !== 'error') continue;
        if (isNoise(entry)) continue;
        checksFailed++;
        findings.push(
          createFinding({
            ruleId: 'runtime-errors',
            dimension: 'functional',
            severity: 'critical',
            page: entry.page || context.page,
            url: entry.url || context.url,
            message: `JavaScript runtime error: ${entry.text}`,
            actual: entry,
            evidence: [evidence],
          }),
        );
      }
    }

    return {
      findings,
      checksRun: consoleEvidence.length,
      checksPassed: consoleEvidence.length - checksFailed,
      checksFailed,
    };
  },
};

function isNoise(entry: ConsoleEntry): boolean {
  const text = entry.text.toLowerCase();
  return (
    text.includes('favicon') ||
    text.includes('analytics') ||
    text.includes('download the react devtools') ||
    text.includes('source map')
  );
}
