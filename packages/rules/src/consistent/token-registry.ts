import type { Rule, RuleContext, RuleResult, Finding, TokenCategory } from '@syy-uime/core';
import { createFinding } from '../finding.js';
import { getTokenBaseline, styleEvidence } from './token-helpers.js';

/** Map a token to candidate Tailwind v4 / shadcn CSS custom property names. */
export function tokenToCssVarCandidates(name: string, category: TokenCategory, path?: string[]): string[] {
  const kebab = name.replace(/_/g, '-').replace(/\./g, '-');
  const stripped = kebab.replace(/^(global|core|base|primitives|primitive)-/, '').replace(/^cssvars-(theme|light|dark)-/, '');
  const suffixMap: Record<TokenCategory, string[]> = {
    color: ['color', ''],
    borderRadius: ['radius', ''],
    spacing: ['spacing', ''],
    fontSize: ['text', 'font-size', ''],
    lineHeight: ['leading', 'line-height', ''],
    fontFamily: ['font', 'font-family', ''],
    dimension: [''],
    shadow: ['shadow', ''],
    other: [''],
  };
  const prefixed = suffixMap[category].map((prefix) =>
    prefix ? `--${prefix}-${stripped}` : `--${stripped}`,
  );
  // shadcn/Tailwind v4 conventions: --primary, --radius-md, --text-base, --font-sans
  const leaf = path?.[path.length - 1] ?? kebab.split('-').pop() ?? kebab;
  prefixed.push(`--${leaf}`);
  return [...new Set(prefixed)];
}

/**
 * Check whether design tokens are actually registered as CSS custom properties
 * on :root — catches tokens that exist in the file but never reach the app.
 */
export const tokenRegistryRule: Rule = {
  id: 'token-registry',
  dimension: 'consistent',
  requiredEvidence: ['computed-style', 'token-baseline'],
  execute(context: RuleContext): RuleResult {
    if (context.config.designSystem?.checks?.registry === false) {
      return { findings: [], checksRun: 0, checksPassed: 0, checksFailed: 0 };
    }
    const baseline = getTokenBaseline(context);
    const styles = styleEvidence(context);
    const findings: Finding[] = [];
    if (!baseline || styles.length === 0) {
      return { findings, checksRun: 0, checksPassed: 0, checksFailed: 0 };
    }

    const registered = new Set<string>();
    for (const ev of styles) {
      for (const name of Object.keys(ev.data.cssVariables ?? {})) registered.add(name);
    }

    const missing: { token: string; candidates: string[] }[] = [];
    let checked = 0;
    for (const token of baseline.tokens) {
      checked++;
      const candidates = tokenToCssVarCandidates(token.name, token.category, token.path);
      if (!candidates.some((c) => registered.has(c))) {
        missing.push({ token: token.name, candidates });
      }
    }

    if (missing.length > 0 && checked > 0) {
      const ratio = missing.length / checked;
      findings.push(
        createFinding({
          ruleId: 'token-registry',
          dimension: 'consistent',
          severity: ratio > 0.5 ? 'minor' : 'info',
          page: context.page,
          url: context.url,
          message: `${missing.length} of ${checked} declared tokens are not registered as :root CSS variables (e.g. ${missing
            .slice(0, 3)
            .map((m) => `--${m.candidates[0].replace(/^--/, '')}`)
            .join(', ')}). Tailwind v4 @theme/shadcn variables may be out of sync with the token file.`,
          actual: { missingCount: missing.length, checked, missing: missing.slice(0, 20) },
          evidence: styles.slice(0, 1),
        }),
      );
    }

    return {
      findings,
      checksRun: checked,
      checksPassed: checked - missing.length,
      checksFailed: missing.length,
    };
  },
};
