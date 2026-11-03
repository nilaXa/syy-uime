import type { Evidence, Finding, RuleContext, Severity, StyleCollection, TokenBaseline, TokenCategory, TokenEntry } from '@syy-uime/core';
import { matchFontFamily, matchToken, matchTokenTolerance, nearestToken, normalizeValue } from '@syy-uime/design-tokens';
import { createFinding } from '../finding.js';

export function getTokenBaseline(context: RuleContext): TokenBaseline | undefined {
  const evidence = (context.globalEvidence ?? []).find((e) => e.type === 'token-baseline');
  return evidence?.data as TokenBaseline | undefined;
}

export function tokenEntries(baseline: TokenBaseline, categories: TokenCategory[]): TokenEntry[] {
  return categories.flatMap((c) => baseline.byCategory[c] ?? []);
}

export function styleEvidence(context: RuleContext): Evidence<StyleCollection>[] {
  return context.evidence.filter((e) => e.type === 'computed-style') as Evidence<StyleCollection>[];
}

export interface TokenViolation {
  selector: string;
  property: string;
  value: string;
  elementCount?: number;
}

const SKIP_VALUES = new Set(['', 'none', 'normal', 'inherit', 'initial', 'unset', 'auto', 'currentcolor', 'transparent']);

export function isSkippable(value: string | undefined, extras: string[] = []): boolean {
  if (value == null) return true;
  const v = value.trim().toLowerCase();
  if (SKIP_VALUES.has(v) || extras.includes(v)) return true;
  return v === 'rgba(0, 0, 0, 0)' || v === 'rgb(0, 0, 0, 0)' || v.startsWith('oklch(0 0 0 / 0');
}

export function isCompliant(entries: TokenEntry[], value: string, strict: boolean, property?: string): TokenEntry | undefined {
  if (property === 'fontFamily' || property === 'font-family') {
    return matchFontFamily(entries, value);
  }
  return matchToken(entries, value) ?? (strict ? undefined : matchTokenTolerance(entries, value));
}

/**
 * Line-height compliance: matches a lineHeight/dimension token directly, or a
 * unitless lineHeight token when `token × font-size` equals the computed px value.
 */
export function isCompliantLineHeight(
  entries: TokenEntry[],
  value: string,
  fontSize: string,
  strict: boolean,
): TokenEntry | undefined {
  const direct = isCompliant(entries, value, strict, 'lineHeight');
  if (direct) return direct;

  const lhPx = value.trim().match(/^([\d.]+)px$/);
  const fsPx = fontSize.trim().match(/^([\d.]+)px$/);
  if (!lhPx || !fsPx) return undefined;
  const ratio = Number(lhPx[1]) / Number(fsPx[1]);

  return entries.find((t) => {
    const unitless = t.value.trim().match(/^[\d.]+$/);
    if (!unitless) return false;
    const expected = Number(t.value) * Number(fsPx[1]);
    return strict ? Math.abs(expected - Number(lhPx[1])) < 0.01 : Math.abs(ratio - Number(t.value)) <= 0.05;
  });
}

const MAX_FINDINGS_PER_RULE = 20;

/**
 * One finding per distinct (property, value) — not per element — to keep
 * findings readable. Widespread violations escalate to 'major'.
 */
export function violationsToFindings(args: {
  ruleId: string;
  context: RuleContext;
  violations: TokenViolation[];
  tokens: TokenEntry[];
  totalChecked: number;
  evidence: Evidence[];
}): Finding[] {
  const { ruleId, context, violations, tokens, totalChecked, evidence } = args;
  const groups = new Map<string, { property: string; value: string; selectors: Set<string>; count: number }>();

  for (const v of violations) {
    const key = `${v.property}|${normalizeValue(v.value)}`;
    const group = groups.get(key) ?? { property: v.property, value: v.value, selectors: new Set(), count: 0 };
    group.count += v.elementCount ?? 1;
    group.selectors.add(v.selector);
    groups.set(key, group);
  }

  const findings: Finding[] = [];
  for (const group of [...groups.values()].slice(0, MAX_FINDINGS_PER_RULE)) {
    const widespread = group.count >= 5 || (totalChecked > 0 && group.count / totalChecked >= 0.3);
    const severity: Severity = widespread ? 'major' : 'minor';
    const expected = nearestToken(tokens, group.value);
    const sample = [...group.selectors].slice(0, 3).join(', ');

    findings.push(
      createFinding({
        ruleId,
        dimension: 'consistent',
        severity,
        page: context.page,
        url: context.url,
        selector: sample,
        message: `Off-token ${group.property} "${group.value}" used on ${group.count} element${group.count === 1 ? '' : 's'} (${sample}${group.selectors.size > 3 ? ', …' : ''})`,
        expected: expected ? `${expected.name} = ${expected.value}` : 'A value from the approved token set',
        actual: { property: group.property, value: group.value },
        evidence,
      }),
    );
  }
  return findings;
}
