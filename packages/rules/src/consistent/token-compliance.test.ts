import { describe, it, expect } from 'vitest';
import type { RuleContext, StyleCollection, TokenBaseline, TokenCategory, AssessmentConfig } from '@syy-uime/core';
import { normalizeValue } from '@syy-uime/design-tokens';
import { tokenColorRule, tokenRadiusRule, tokenSpacingRule, tokenTypographyRule } from './token-compliance.js';
import { tokenRegistryRule, tokenToCssVarCandidates } from './token-registry.js';

function token(name: string, category: TokenCategory, value: string) {
  return { name, path: name.split('-'), category, value, normalized: normalizeValue(value) };
}

const baseline: TokenBaseline = {
  source: 'oklch.json',
  tokens: [],
  byCategory: {
    color: [token('primary', 'color', 'oklch(0.55 0.2 250)'), token('muted', 'color', 'oklch(0.9 0.01 250)')],
    dimension: [token('space-md', 'dimension', '16px')],
    borderRadius: [token('radius-md', 'borderRadius', '6px')],
    fontFamily: [token('body', 'fontFamily', 'Inter')],
    fontSize: [token('text-base', 'fontSize', '16px')],
    lineHeight: [token('leading-normal', 'lineHeight', '24px')],
    spacing: [token('spacing-md', 'spacing', '16px')],
    shadow: [],
    other: [],
  },
};
baseline.tokens = Object.values(baseline.byCategory).flat();

function ctx(entries: Partial<StyleCollection['entries'][number]>[], opts: {
  checks?: Record<string, boolean>;
  strict?: boolean;
  cssVariables?: Record<string, string>;
} = {}): RuleContext {
  const styles: StyleCollection = {
    page: 'home',
    viewport: 'desktop',
    entries: entries.map((e) => ({
      selector: 'button',
      tag: 'button',
      fingerprint: {} as any,
      ...e,
    } as StyleCollection['entries'][number])),
    cssVariables: opts.cssVariables,
  };
  return {
    page: 'home',
    url: 'http://localhost/',
    viewport: { name: 'desktop', width: 1440, height: 900 },
    evidence: [{ type: 'computed-style', data: styles }],
    screenshots: [],
    config: { designSystem: { checks: opts.checks as any, strict: opts.strict } } as AssessmentConfig,
    globalEvidence: [{ type: 'token-baseline', data: baseline }],
  };
}

function fp(over: Record<string, string>): StyleCollection['entries'][number]['fingerprint'] {
  return over as any;
}

describe('tokenColorRule', () => {
  it('flags off-token colors, skips transparent', () => {
    const result = tokenColorRule.execute(ctx([
      { fingerprint: fp({ color: 'oklch(0.55 0.2 250)', backgroundColor: 'oklch(0.9 0.01 250)', border: 'none' }) },
      { fingerprint: fp({ color: 'rgb(255, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', border: 'none' }) },
    ]));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].message).toContain('rgb(255, 0, 0)');
    expect(result.findings[0].ruleId).toBe('token-color-compliance');
  });

  it('extracts border colors from the border shorthand', () => {
    const result = tokenColorRule.execute(ctx([
      { fingerprint: fp({ color: 'oklch(0.55 0.2 250)', border: '1px solid rgb(9, 9, 9)' }) },
    ]));
    expect(result.findings.some((f) => f.message.includes('border-color'))).toBe(true);
  });

  it('is skipped when checks.colors=false', () => {
    const result = tokenColorRule.execute(ctx([
      { fingerprint: fp({ color: 'rgb(255, 0, 0)', border: 'none' }) },
    ], { checks: { colors: false } }));
    expect(result.findings).toHaveLength(0);
  });
});

describe('tokenRadiusRule', () => {
  it('flags off-token radius, allows pill/percent and 0', () => {
    const result = tokenRadiusRule.execute(ctx([
      { fingerprint: fp({ borderRadius: '6px 6px 6px 6px' }) },
      { fingerprint: fp({ borderRadius: '0px 50% 9999px 0px' }) },
      { fingerprint: fp({ borderRadius: '12px' }) },
    ]));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].message).toContain('12px');
  });
});

describe('tokenSpacingRule', () => {
  it('flags off-token spacing, allows 0 and auto', () => {
    const result = tokenSpacingRule.execute(ctx([
      { fingerprint: fp({ padding: '16px 0px', margin: 'auto', gap: '16px' }) },
      { fingerprint: fp({ padding: '13px', margin: '0px', gap: '0px' }) },
    ]));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].message).toContain('13px');
  });
});

describe('tokenTypographyRule', () => {
  it('flags off-token font sizes and families', () => {
    const result = tokenTypographyRule.execute(ctx([
      { fingerprint: fp({ fontSize: '16px', fontFamily: 'Inter', lineHeight: 'normal' }) },
      { fingerprint: fp({ fontSize: '18px', fontFamily: 'Comic Sans MS', lineHeight: '24px' }) },
    ]));
    const text = result.findings.map((f) => f.message).join(' ');
    expect(text).toContain('18px');
    expect(text).toContain('Comic Sans MS');
    expect(result.findings).toHaveLength(2);
  });
});

describe('tokenRegistryRule', () => {
  it('reports declared tokens missing as :root variables', () => {
    const result = tokenRegistryRule.execute(ctx([], {
      cssVariables: { '--color-primary': 'oklch(0.55 0.2 250)' },
    }));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].severity).toBe('minor');
    expect(result.findings[0].message).toContain('not registered');
  });

  it('maps token names to Tailwind var candidates', () => {
    expect(tokenToCssVarCandidates('primitives-color-primary', 'color')).toContain('--color-color-primary');
    expect(tokenToCssVarCandidates('color-primary', 'color')).toContain('--color-primary');
  });
});
