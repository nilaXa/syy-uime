import { describe, it, expect } from 'vitest';
import { parseTokenFile } from './parser.js';
import { normalizeValue, matchToken, nearestToken, classifyValue } from './normalize.js';
import type { TokenEntry } from '@syy-uime/core';

describe('normalizeValue', () => {
  it('canonicalizes numbers inside functions', () => {
    expect(normalizeValue('oklch(0.700 0.150 250.0)')).toBe('oklch(0.7 0.15 250)');
    expect(normalizeValue('  OKLCH(0.7  0.15 250) ')).toBe('oklch(0.7 0.15 250)');
    expect(normalizeValue('rgba(0, 0, 0, 0.50)')).toBe('rgba(0,0,0,0.5)');
  });
  it('canonicalizes plain dimensions', () => {
    expect(normalizeValue('16.0px')).toBe('16px');
    expect(normalizeValue(' 1.0REM ')).toBe('16px'); // rem → px (16px base)
    expect(normalizeValue('0.375rem')).toBe('6px');
    expect(normalizeValue('50%')).toBe('50%');
  });
});

describe('classifyValue', () => {
  it('detects color and dimension values', () => {
    expect(classifyValue('oklch(0.7 0.15 250)')).toBe('color');
    expect(classifyValue('#FF0080')).toBe('color');
    expect(classifyValue('16px')).toBe('dimension');
    expect(classifyValue('Arial')).toBe('unknown');
  });
});

const dtcg = {
  $metadata: { tokenSetOrder: ['primitives', 'light'] },
  primitives: {
    color: {
      primary: { $type: 'color', $value: 'oklch(0.55 0.2 250)' },
      muted: { $type: 'color', $value: 'oklch(0.9 0.01 250)' },
    },
    space: {
      sm: { $type: 'dimension', $value: '8px' },
      md: { $type: 'dimension', $value: '16px' },
    },
  },
  light: {
    color: {
      surface: { $type: 'color', $value: '{primitives.color.muted}' },
    },
  },
};

const tokensStudio = {
  global: {
    'font-size': { base: { type: 'fontSize', value: '16px' } },
    radius: { md: { type: 'borderRadius', value: '6px' } },
    brand: { primary: { type: 'color', value: 'oklch(0.5 0.2 250)' } },
  },
  light: {
    'button-bg': { type: 'color', value: '{global.brand.primary}' },
  },
  dark: {
    'button-bg': { type: 'color', value: 'oklch(0.2 0.05 250)' },
  },
};

describe('parseTokenFile', () => {
  it('parses W3C DTCG format with alias resolution', () => {
    const tokens = parseTokenFile(dtcg);
    const primary = tokens.find((t) => t.name === 'primitives-color-primary');
    expect(primary?.category).toBe('color');
    expect(primary?.value).toBe('oklch(0.55 0.2 250)');

    const surface = tokens.find((t) => t.name === 'light-color-surface');
    expect(surface?.value).toBe('oklch(0.9 0.01 250)'); // alias resolved via base set merge
  });

  it('parses Tokens Studio format and honors theme', () => {
    const tokens = parseTokenFile(tokensStudio, { theme: 'light' });
    expect(tokens.find((t) => t.name === 'light-button-bg')?.value).toBe('oklch(0.5 0.2 250)');
    expect(tokens.find((t) => t.name === 'global-font-size-base')?.category).toBe('fontSize');
    expect(tokens.find((t) => t.name === 'global-radius-md')?.category).toBe('borderRadius');
    // dark-set tokens are filtered out when a theme is selected
    expect(tokens.find((t) => t.name === 'dark-button-bg')).toBeUndefined();
  });

  it('parses flat name→value maps and infers categories', () => {
    const tokens = parseTokenFile({ primary: 'oklch(0.7 0.15 250)', 'space-2': '8px', body: 'Inter' });
    expect(tokens.find((t) => t.name === 'primary')?.category).toBe('color');
    expect(tokens.find((t) => t.name === 'space-2')?.category).toBe('spacing');
    expect(tokens.find((t) => t.name === 'body')?.category).toBe('other');
  });

  it('parses shadcn registry cssVars format', () => {
    const shadcn = {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      cssVars: {
        theme: {
          'radius-md': '0.375rem',
          'text-base': '1rem',
          'text-base--line-height': '1.5',
          'font-sans': 'Lato, sans-serif',
          'blur-xs': '4px',
          'breakpoint-sm': '40rem',
        },
        light: { primary: 'oklch(0.469 0.106 264.361)', border: 'oklch(0.889 0.006 274.958)' },
        dark: { primary: 'oklch(0.2 0.05 250)' },
      },
    };
    const all = parseTokenFile(shadcn);
    expect(all.find((t) => t.name === 'cssVars-theme-radius-md')?.category).toBe('borderRadius');
    expect(all.find((t) => t.name === 'cssVars-theme-radius-md')?.normalized).toBe('6px'); // rem → px
    expect(all.find((t) => t.name === 'cssVars-theme-text-base')?.category).toBe('fontSize');
    expect(all.find((t) => t.name === 'cssVars-theme-text-base--line-height')?.category).toBe('lineHeight');
    expect(all.find((t) => t.name === 'cssVars-theme-font-sans')?.category).toBe('fontFamily');
    expect(all.find((t) => t.name === 'cssVars-light-primary')?.category).toBe('color');
    expect(all.find((t) => t.name === 'cssVars-dark-primary')?.category).toBe('color');

    const light = parseTokenFile(shadcn, { theme: 'light' });
    expect(light.find((t) => t.name === 'cssVars-dark-primary')).toBeUndefined();
    expect(light.find((t) => t.name === 'cssVars-light-primary')).toBeDefined();
    // shared theme set survives theme filtering
    expect(light.find((t) => t.name === 'cssVars-theme-radius-md')).toBeDefined();
  });

  it('rejects non-object input', () => {
    expect(() => parseTokenFile(['a'])).toThrow();
  });
});

describe('matchToken / nearestToken', () => {
  const entries: TokenEntry[] = [
    { name: 'primary', path: ['primary'], category: 'color', value: 'oklch(0.55 0.2 250)', normalized: normalizeValue('oklch(0.55 0.2 250)') },
    { name: 'muted', path: ['muted'], category: 'color', value: 'oklch(0.9 0.01 250)', normalized: normalizeValue('oklch(0.9 0.01 250)') },
  ];

  it('exact-matches normalized values', () => {
    expect(matchToken(entries, 'OKLCH(0.55 0.200 250)')?.name).toBe('primary');
    expect(matchToken(entries, 'oklch(0.5 0.5 5)')).toBeUndefined();
  });

  it('finds nearest oklch token', () => {
    expect(nearestToken(entries, 'oklch(0.56 0.21 250)')?.name).toBe('primary');
  });
});
