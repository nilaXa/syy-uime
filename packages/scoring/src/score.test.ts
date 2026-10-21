import { describe, it, expect } from 'vitest';
import { calculateScore, calculateOverallScore } from './score.js';
import type { Finding } from '@syy-uime/core';

function finding(severity: Finding['severity']): Finding {
  return {
    id: 'x',
    ruleId: 'rule',
    dimension: 'functional',
    severity,
    page: '/',
    url: 'http://localhost/',
    message: 'msg',
    evidence: [],
    confidence: 1,
  };
}

describe('calculateScore', () => {
  it('returns 100 for no findings', () => {
    expect(calculateScore([])).toBe(100);
  });

  it('subtracts weighted penalties and applies critical cap', () => {
    const findings = [finding('critical'), finding('major'), finding('minor')];
    // Critical caps score at 75, so raw 88 is capped to 75
    expect(calculateScore(findings)).toBe(75);
  });

  it('caps the score when a blocker is present', () => {
    const findings = [finding('blocker'), finding('minor')];
    const score = calculateScore(findings);
    expect(score).toBeLessThanOrEqual(60);
  });

  it('caps the score when a critical is present', () => {
    const findings = [finding('critical')];
    const score = calculateScore(findings);
    expect(score).toBeLessThanOrEqual(75);
  });

  it('does not fall below 0', () => {
    const findings = Array.from({ length: 50 }, () => finding('blocker'));
    expect(calculateScore(findings)).toBe(0);
  });
});

describe('calculateOverallScore', () => {
  it('computes an equal weighted average', () => {
    const scores = {
      functional: 80,
      consistent: 90,
      accessible: 70,
      responsive: 60,
    };
    expect(calculateOverallScore(scores)).toBe(75);
  });
});
