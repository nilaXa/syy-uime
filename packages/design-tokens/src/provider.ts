import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { AssessmentContext, EvidenceCollection, EvidenceProvider } from '@syy-uime/core';
import { loadTokenBaseline } from './baseline.js';

/**
 * Run-level evidence provider: parses the configured design-token file once
 * and exposes it as `token-baseline` evidence to every rule.
 */
export class TokenBaselineProvider implements EvidenceProvider {
  readonly id = 'token-baseline';

  async collect(context: AssessmentContext): Promise<EvidenceCollection> {
    const ds = context.config.designSystem;
    if (!ds?.tokenFile) return { evidence: [], screenshots: [] };

    const cwd = process.env.INIT_CWD ?? process.cwd();
    const candidates = [resolve(cwd, ds.tokenFile)];
    if (context.options.configPath) {
      candidates.push(resolve(cwd, dirname(context.options.configPath), ds.tokenFile));
    }
    const path = candidates.find((c) => existsSync(c));
    if (!path) {
      throw new Error(`tokenFile not found (tried ${candidates.join(', ')})`);
    }
    const baseline = await loadTokenBaseline(path, { theme: ds.theme });

    return {
      evidence: [{ type: 'token-baseline', data: baseline }],
      screenshots: [],
    };
  }
}
