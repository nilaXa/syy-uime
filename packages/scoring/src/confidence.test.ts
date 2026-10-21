import { describe, it, expect } from 'vitest';
import { calculateConfidence, calculateOverallConfidence } from './confidence.js';
import type { DimensionAssessment } from '@syy-uime/core';

function dimAssessment(confidence: number): DimensionAssessment {
  return {
    dimension: 'functional',
    score: 80,
    confidence,
    checksRun: 10,
    checksPassed: 8,
    checksFailed: 2,
    findings: [],
    coverageNotes: [],
  };
}

describe('calculateConfidence', () => {
  it('returns 1 when full coverage exists', () => {
    expect(
      calculateConfidence({
        dimension: 'functional',
        pagesAssessed: 4,
        routesConfigured: 4,
        viewports: 3,
        journeysConfigured: 2,
        journeysExecuted: 2,
      }),
    ).toBe(1);
  });

  it('lowers confidence when journeys are missed', () => {
    expect(
      calculateConfidence({
        dimension: 'functional',
        pagesAssessed: 4,
        routesConfigured: 4,
        viewports: 3,
        journeysConfigured: 2,
        journeysExecuted: 1,
      }),
    ).toBe(0.5);
  });

  it('returns 0 for responsive when no viewports are configured', () => {
    expect(
      calculateConfidence({
        dimension: 'responsive',
        pagesAssessed: 4,
        routesConfigured: 4,
        viewports: 0,
        journeysConfigured: 0,
        journeysExecuted: 0,
      }),
    ).toBe(0);
  });
});

describe('calculateOverallConfidence', () => {
  it('averages dimension confidences', () => {
    const dimensions = {
      functional: dimAssessment(1),
      consistent: dimAssessment(0.5),
      accessible: dimAssessment(0.75),
      responsive: dimAssessment(0.25),
    };
    expect(calculateOverallConfidence(dimensions)).toBe(0.63);
  });
});
