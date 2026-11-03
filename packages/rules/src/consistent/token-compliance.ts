import type { Evidence, Rule, RuleContext, RuleResult, ComputedStyleEntry } from '@syy-uime/core';
import {
  getTokenBaseline,
  tokenEntries,
  styleEvidence,
  isSkippable,
  isCompliant,
  isCompliantLineHeight,
  violationsToFindings,
  type TokenViolation,
} from './token-helpers.js';

interface ComplianceSpec {
  ruleId: string;
  /** Config toggle key under designSystem.checks */
  checkKey: 'colors' | 'radius' | 'spacing' | 'typography';
  /** Token categories to compare against (in priority order). */
  categories: Parameters<typeof tokenEntries>[1];
  /** Which fingerprint properties to check, plus a value extractor per property. */
  properties: (keyof ComputedStyleEntry['fingerprint'])[];
  extract?: (entry: ComputedStyleEntry) => { property: string; value: string }[];
  allowed?: string[];
}

const BORDER_COLOR_RE = /(oklch|oklab|lab|lch|hsl|hsla|rgba?|hwb|color)\([^)]*\)|#[0-9a-f]{3,8}/i;

function extractBorderColors(border: string): string[] {
  const m = border.match(BORDER_COLOR_RE);
  return m ? [m[0]] : [];
}

function lengthComponents(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}

function makeComplianceRule(spec: ComplianceSpec): Rule {
  return {
    id: spec.ruleId,
    dimension: 'consistent',
    requiredEvidence: ['computed-style', 'token-baseline'],
    execute(context: RuleContext): RuleResult {
      if (context.config.designSystem?.checks?.[spec.checkKey] === false) {
        return { findings: [], checksRun: 0, checksPassed: 0, checksFailed: 0 };
      }
      const baseline = getTokenBaseline(context);
      if (!baseline) return { findings: [], checksRun: 0, checksPassed: 0, checksFailed: 0 };

      const tokens = tokenEntries(baseline, spec.categories);
      const strict = context.config.designSystem?.strict !== false;
      const violations: TokenViolation[] = [];
      let totalChecked = 0;
      let evidenceList: Evidence[] = [];

      for (const evidence of styleEvidence(context)) {
        evidenceList = [evidence];
        for (const entry of evidence.data.entries) {
          const props: { property: string; value: string }[] = spec.extract
            ? spec.extract(entry)
            : spec.properties.flatMap((p): { property: string; value: string }[] => {
                const raw = entry.fingerprint[p];
                if (typeof raw !== 'string' || !raw.trim()) return [];
                if (p === 'borderRadius' || p === 'padding' || p === 'margin' || p === 'gap') {
                  return lengthComponents(raw).map((v) => ({ property: p as string, value: v }));
                }
                return [{ property: p as string, value: raw }];
              });

          for (const { property, value } of props) {
            if (isSkippable(value, spec.allowed)) continue;
            totalChecked++;
            const compliant =
              property === 'lineHeight'
                ? isCompliantLineHeight(tokens, value, entry.fingerprint.fontSize, strict)
                : isCompliant(tokens, value, strict, property);
            if (!compliant) {
              violations.push({ selector: entry.selector, property, value });
            }
          }
        }
      }

      const findings = violationsToFindings({
        ruleId: spec.ruleId,
        context,
        violations,
        tokens,
        totalChecked,
        evidence: evidenceList,
      });

      return {
        findings,
        checksRun: totalChecked,
        checksPassed: totalChecked - violations.length,
        checksFailed: violations.length,
      };
    },
  };
}

export const tokenColorRule = makeComplianceRule({
  ruleId: 'token-color-compliance',
  checkKey: 'colors',
  categories: ['color'],
  properties: ['color', 'backgroundColor'],
  extract: (entry) => {
    const props: { property: string; value: string }[] = [];
    if (entry.fingerprint.color) props.push({ property: 'color', value: entry.fingerprint.color });
    if (entry.fingerprint.backgroundColor) props.push({ property: 'background-color', value: entry.fingerprint.backgroundColor });
    for (const c of extractBorderColors(entry.fingerprint.border ?? '')) {
      props.push({ property: 'border-color', value: c });
    }
    return props;
  },
});

export const tokenRadiusRule = makeComplianceRule({
  ruleId: 'token-radius-compliance',
  checkKey: 'radius',
  categories: ['borderRadius'],
  properties: ['borderRadius'],
  allowed: ['0', '0px', '50%', '100%', '9999px', 'calc(infinity * 1px)'],
});

export const tokenSpacingRule = makeComplianceRule({
  ruleId: 'token-spacing-compliance',
  checkKey: 'spacing',
  categories: ['spacing', 'dimension'],
  properties: ['padding', 'margin', 'gap'],
  allowed: ['0', '0px', 'auto'],
});

export const tokenTypographyRule = makeComplianceRule({
  ruleId: 'token-typography-compliance',
  checkKey: 'typography',
  categories: ['fontSize', 'lineHeight', 'fontFamily', 'dimension'],
  properties: ['fontSize', 'lineHeight', 'fontFamily'],
  allowed: ['normal'],
});
