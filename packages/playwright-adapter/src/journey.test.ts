import { describe, it, expect } from 'vitest';
import { journeyEvidence } from './journey.js';
import type { JourneyResult } from '@syy-uime/core';

describe('journeyEvidence', () => {
  it('wraps a journey result as evidence', () => {
    const result: JourneyResult = {
      name: 'Login',
      start: '/login',
      success: true,
      steps: [],
    };
    const evidence = journeyEvidence(result);
    expect(evidence.type).toBe('journey-step');
    expect(evidence.data).toBe(result);
  });
});
