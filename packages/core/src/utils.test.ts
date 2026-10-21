import { describe, it, expect } from 'vitest';
import { generateId, generateRunId, severityRank, confidenceLabel, normalizeDimensions } from './utils.js';

describe('utils', () => {
  it('generates unique IDs', () => {
    const a = generateId();
    const b = generateId();
    expect(a).toHaveLength(12);
    expect(a).not.toBe(b);
  });

  it('generates run IDs with expected prefix', () => {
    const runId = generateRunId();
    expect(runId).toMatch(/^UI-VAL-\d+-\d+-[a-f0-9]+$/);
  });

  it('ranks severities correctly', () => {
    expect(severityRank('blocker')).toBeGreaterThan(severityRank('critical'));
    expect(severityRank('critical')).toBeGreaterThan(severityRank('info'));
  });

  it('labels confidence', () => {
    expect(confidenceLabel(0.9)).toBe('High');
    expect(confidenceLabel(0.6)).toBe('Medium');
    expect(confidenceLabel(0.1)).toBe('Low');
  });

  it('normalizes dimensions', () => {
    expect(normalizeDimensions({ functional: true, accessible: false })).toEqual([
      'functional',
      'consistent',
      'responsive',
    ]);
  });
});
