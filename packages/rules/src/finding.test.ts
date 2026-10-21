import { describe, it, expect } from 'vitest';
import { createFinding } from './finding.js';
import type { FindingInput } from './finding.js';

describe('createFinding', () => {
  it('creates a finding with required fields', () => {
    const input: FindingInput = {
      ruleId: 'test-rule',
      dimension: 'functional',
      severity: 'critical',
      page: '/',
      url: 'http://localhost/',
      message: 'Something failed',
    };

    const finding = createFinding(input);
    expect(finding.ruleId).toBe('test-rule');
    expect(finding.dimension).toBe('functional');
    expect(finding.severity).toBe('critical');
    expect(finding.id).toMatch(/^finding-/);
    expect(finding.confidence).toBe(1);
  });

  it('includes optional evidence', () => {
    const evidence = { type: 'dom' as const, data: { title: 'Test' } };
    const finding = createFinding({
      ruleId: 'test',
      dimension: 'accessible',
      severity: 'minor',
      page: '/',
      url: 'http://localhost/',
      message: 'msg',
      evidence: [evidence],
    });
    expect(finding.evidence).toHaveLength(1);
  });
});
