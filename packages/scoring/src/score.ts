import type { Dimension, Finding, Severity } from '@syy-uime/core';

export interface ScoreConfig {
  weights: Record<Severity, number>;
  caps: {
    blocker?: number;
    critical?: number;
  };
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  weights: {
    blocker: 10,
    critical: 7,
    major: 4,
    minor: 1,
    info: 0,
  },
  caps: {
    blocker: 60,
    critical: 75,
  },
};

/**
 * Calculate a dimension score starting from 100 and subtracting weighted
 * penalties for findings. Apply severity caps so that a single serious failure
 * is not hidden by many trivial successes.
 */
export function calculateScore(
  findings: Finding[],
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): number {
  const penalty = findings.reduce((sum, finding) => {
    return sum + (config.weights[finding.severity] ?? 0);
  }, 0);

  let score = Math.max(0, 100 - penalty);

  if (config.caps.blocker !== undefined && hasSeverity(findings, 'blocker')) {
    score = Math.min(score, config.caps.blocker);
  }

  if (config.caps.critical !== undefined && hasSeverity(findings, 'critical')) {
    score = Math.min(score, config.caps.critical);
  }

  return Math.round(score);
}

function hasSeverity(findings: Finding[], severity: Severity): boolean {
  return findings.some((f) => f.severity === severity);
}

export interface DimensionWeights {
  functional: number;
  consistent: number;
  accessible: number;
  responsive: number;
}

export const DEFAULT_DIMENSION_WEIGHTS: DimensionWeights = {
  functional: 0.25,
  consistent: 0.25,
  accessible: 0.25,
  responsive: 0.25,
};

/**
 * Compute the overall score as a weighted average of dimension scores.
 */
export function calculateOverallScore(
  scores: Record<Dimension, number>,
  weights: DimensionWeights = DEFAULT_DIMENSION_WEIGHTS,
): number {
  const weighted =
    scores.functional * weights.functional +
    scores.consistent * weights.consistent +
    scores.accessible * weights.accessible +
    scores.responsive * weights.responsive;

  return Math.round(weighted);
}
