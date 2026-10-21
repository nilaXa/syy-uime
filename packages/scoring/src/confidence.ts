import type { Dimension, CoverageSummary, DimensionAssessment } from '@syy-uime/core';

export interface ConfidenceInputs {
  dimension: Dimension;
  pagesAssessed: number;
  routesConfigured: number;
  viewports: number;
  journeysConfigured: number;
  journeysExecuted: number;
  elementSamples?: number;
  minimumElementSamples?: number;
}

/**
 * Calculate per-dimension confidence as a coverage ratio in the range 0-1.
 * This is intentionally separate from the quality score.
 */
export function calculateConfidence(inputs: ConfidenceInputs): number {
  const { dimension, pagesAssessed, routesConfigured, viewports, journeysConfigured, journeysExecuted } =
    inputs;

  let coverage = 1;

  if (routesConfigured > 0) {
    coverage = Math.min(coverage, pagesAssessed / routesConfigured);
  }

  switch (dimension) {
    case 'functional': {
      if (journeysConfigured > 0) {
        coverage = Math.min(coverage, journeysExecuted / journeysConfigured);
      }
      break;
    }
    case 'consistent': {
      const minimum = inputs.minimumElementSamples ?? 20;
      const samples = inputs.elementSamples ?? 0;
      coverage = Math.min(coverage, Math.min(1, samples / minimum));
      break;
    }
    case 'accessible':
      // Accessibility confidence is driven by pages × viewports scanned by Axe.
      if (viewports === 0 || pagesAssessed === 0) {
        coverage = 0;
      }
      break;
    case 'responsive': {
      if (viewports === 0 || pagesAssessed === 0) {
        coverage = 0;
      }
      break;
    }
  }

  return Math.max(0, Math.min(1, Number(coverage.toFixed(2))));
}

export function calculateOverallConfidence(
  dimensions: Record<Dimension, DimensionAssessment>,
): number {
  const values = Object.values(dimensions).map((d) => d.confidence);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Number(avg.toFixed(2));
}

export function buildCoverageSummary(
  routesConfigured: number,
  pagesAssessed: number,
  viewports: number,
  screenshotsCaptured: number,
  journeysConfigured: number,
  journeysExecuted: number,
): CoverageSummary {
  return {
    routesConfigured,
    pagesAssessed,
    viewports,
    screenshotsCaptured,
    journeysConfigured,
    journeysExecuted,
  };
}
