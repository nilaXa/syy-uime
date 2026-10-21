import { describe, it, expect } from 'vitest';
import { RuleEngine, flattenFindings, sumChecks } from './engine.js';
import { createFinding } from './finding.js';
import type { Rule, RuleContext, RuleResult, Evidence } from '@syy-uime/core';

describe('RuleEngine', () => {
  it('runs rules that have required evidence', async () => {
    const rule: Rule = {
      id: 'dom-check',
      dimension: 'functional',
      requiredEvidence: ['dom'],
      execute(): RuleResult {
        return {
          findings: [createFinding({ ruleId: 'dom-check', dimension: 'functional', severity: 'minor', page: '/', url: '/', message: 'm' })],
          checksRun: 1,
          checksPassed: 0,
          checksFailed: 1,
        };
      },
    };

    const engine = new RuleEngine([rule]);
    const results = await engine.run({
      page: 'home',
      url: 'http://localhost/',
      viewport: { name: 'desktop', width: 1440, height: 900 },
      evidence: [{ type: 'dom', data: {} }],
      screenshots: [],
    });

    expect(results).toHaveLength(1);
    expect(results[0].checksFailed).toBe(1);
  });

  it('skips rules when evidence is missing', async () => {
    const rule: Rule = {
      id: 'axe-check',
      dimension: 'accessible',
      requiredEvidence: ['axe'],
      execute(): RuleResult {
        return { findings: [], checksRun: 1, checksPassed: 1, checksFailed: 0 };
      },
    };

    const engine = new RuleEngine([rule]);
    const results = await engine.run({
      page: 'home',
      url: 'http://localhost/',
      viewport: { name: 'desktop', width: 1440, height: 900 },
      evidence: [{ type: 'dom', data: {} }],
      screenshots: [],
    });

    expect(results).toHaveLength(0);
  });
});

describe('flattenFindings', () => {
  it('flattens findings from results', () => {
    const results: RuleResult[] = [
      { findings: [createFinding({ ruleId: 'a', dimension: 'functional', severity: 'minor', page: '/', url: '/', message: 'a' })], checksRun: 1, checksPassed: 0, checksFailed: 1 },
      { findings: [createFinding({ ruleId: 'b', dimension: 'accessible', severity: 'major', page: '/', url: '/', message: 'b' })], checksRun: 1, checksPassed: 0, checksFailed: 1 },
    ];
    expect(flattenFindings(results)).toHaveLength(2);
  });
});

describe('sumChecks', () => {
  it('sums check counters', () => {
    const results: RuleResult[] = [
      { findings: [], checksRun: 5, checksPassed: 4, checksFailed: 1 },
      { findings: [], checksRun: 3, checksPassed: 2, checksFailed: 1 },
    ];
    expect(sumChecks(results)).toEqual({ run: 8, passed: 6, failed: 2 });
  });
});
