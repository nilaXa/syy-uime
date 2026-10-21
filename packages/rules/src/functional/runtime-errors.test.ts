import { describe, it, expect } from 'vitest';
import { runtimeErrorsRule, type ConsoleEntry } from './runtime-errors.js';
import type { Evidence, RuleContext } from '@syy-uime/core';

function context(entries: ConsoleEntry[]): RuleContext {
  return {
    page: 'home',
    url: 'http://localhost/',
    viewport: { name: 'desktop', width: 1440, height: 900 },
    evidence: [{ type: 'console', data: entries }],
    screenshots: [],
    config: {} as any,
  };
}

describe('runtimeErrorsRule', () => {
  it('creates a critical finding for runtime errors', () => {
    const entries: ConsoleEntry[] = [
      { type: 'error', text: 'ReferenceError: x is not defined', location: 'main.js:10', page: 'home', url: 'http://localhost/' },
    ];
    const result = runtimeErrorsRule.execute(context(entries));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].severity).toBe('critical');
    expect(result.findings[0].ruleId).toBe('runtime-errors');
  });

  it('ignores harmless browser noise', () => {
    const entries: ConsoleEntry[] = [
      { type: 'error', text: 'favicon.ico not found', location: '', page: 'home', url: 'http://localhost/' },
    ];
    const result = runtimeErrorsRule.execute(context(entries));
    expect(result.findings).toHaveLength(0);
  });
});
