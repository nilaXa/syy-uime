import type { Dimension, Assessment, ThresholdConfig } from '@syy-uime/core';

export const EXIT_SUCCESS = 0;
export const EXIT_TECHNICAL_FAILURE = 1;
export const EXIT_THRESHOLD_FAILURE = 2;

export interface ThresholdResult {
  passed: boolean;
  failures: ThresholdFailure[];
  exitCode: number;
}

export interface ThresholdFailure {
  dimension: 'overall' | Dimension;
  threshold: number;
  actual: number;
}

/**
 * Compare assessment scores against configured thresholds.
 */
export function evaluateThresholds(
  assessment: Assessment,
  thresholds: ThresholdConfig = {},
): ThresholdResult {
  const failures: ThresholdFailure[] = [];

  if (thresholds.overall !== undefined && assessment.overallScore < thresholds.overall) {
    failures.push({
      dimension: 'overall',
      threshold: thresholds.overall,
      actual: assessment.overallScore,
    });
  }

  for (const dimension of Object.keys(assessment.dimensions) as Dimension[]) {
    const threshold = thresholds[dimension];
    if (threshold === undefined) continue;

    const actual = assessment.dimensions[dimension].score;
    if (actual < threshold) {
      failures.push({ dimension, threshold, actual });
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    exitCode: failures.length === 0 ? EXIT_SUCCESS : EXIT_THRESHOLD_FAILURE,
  };
}
