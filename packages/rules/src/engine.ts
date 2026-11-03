import type { AssessmentConfig, Evidence, Rule, RuleContext, RuleResult, Finding } from '@syy-uime/core';

export interface EngineContext {
  page: string;
  url: string;
  viewport: { name: string; width: number; height: number };
  evidence: Evidence[];
  screenshots: string[];
  /** Run-level evidence shared across pages (e.g. design-token baseline). */
  globalEvidence?: Evidence[];
  config?: AssessmentConfig;
}

export class RuleEngine {
  private rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  async run(context: EngineContext): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const allEvidence = [...context.evidence, ...(context.globalEvidence ?? [])];

    for (const rule of this.rules) {
      const hasEvidence = rule.requiredEvidence.every((type) =>
        allEvidence.some((e) => e.type === type),
      );

      if (!hasEvidence) continue;

      const ruleContext: RuleContext = {
        page: context.page,
        url: context.url,
        viewport: context.viewport,
        evidence: context.evidence,
        screenshots: context.screenshots,
        config: context.config ?? ({} as AssessmentConfig),
        globalEvidence: context.globalEvidence,
      };

      const result = await rule.execute(ruleContext);
      results.push(result);
    }

    return results;
  }
}

export function flattenFindings(results: RuleResult[]): Finding[] {
  return results.flatMap((r) => r.findings);
}

export function sumChecks(results: RuleResult[]): { run: number; passed: number; failed: number } {
  return results.reduce(
    (acc, r) => ({
      run: acc.run + r.checksRun,
      passed: acc.passed + r.checksPassed,
      failed: acc.failed + r.checksFailed,
    }),
    { run: 0, passed: 0, failed: 0 },
  );
}
