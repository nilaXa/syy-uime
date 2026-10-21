import { describe, it, expect } from 'vitest';
import { renderReport } from './report.js';
import type { Assessment } from '@syy-uime/core';

function sampleAssessment(): Assessment {
  return {
    id: 'test-run',
    project: { name: 'Test', baseUrl: 'http://localhost/' },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    dimensions: {
      functional: { dimension: 'functional', score: 80, confidence: 1, checksRun: 10, checksPassed: 8, checksFailed: 2, findings: [], coverageNotes: [] },
      consistent: { dimension: 'consistent', score: 90, confidence: 1, checksRun: 10, checksPassed: 9, checksFailed: 1, findings: [], coverageNotes: [] },
      accessible: { dimension: 'accessible', score: 70, confidence: 0.8, checksRun: 10, checksPassed: 7, checksFailed: 3, findings: [], coverageNotes: [] },
      responsive: { dimension: 'responsive', score: 85, confidence: 1, checksRun: 10, checksPassed: 8, checksFailed: 2, findings: [], coverageNotes: [] },
    },
    overallScore: 81,
    overallConfidence: 0.95,
    coverage: { pagesAssessed: 4, routesConfigured: 4, viewports: 3, screenshotsCaptured: 12, journeysConfigured: 2, journeysExecuted: 2 },
  };
}

describe('renderReport', () => {
  it('renders overall score and dimension cards', () => {
    const html = renderReport(sampleAssessment(), '/tmp/report.html');
    expect(html).toContain('Overall Score');
    expect(html).toContain('81');
    expect(html).toContain('functional');
    expect(html).toContain('radar-chart');
  });

  it('renders coverage summary', () => {
    const html = renderReport(sampleAssessment(), '/tmp/report.html');
    expect(html).toContain('4</span> pages assessed');
    expect(html).toContain('12</span> screenshots');
  });

  it('renders findings', () => {
    const assessment = sampleAssessment();
    assessment.dimensions.functional.findings = [{
      id: 'f1',
      ruleId: 'runtime-errors',
      dimension: 'functional',
      severity: 'critical',
      page: '/',
      url: 'http://localhost/',
      message: 'JavaScript error',
      evidence: [],
      confidence: 1,
    }];
    const html = renderReport(assessment, '/tmp/report.html');
    expect(html).toContain('JavaScript error');
    expect(html).toContain('severity-critical');
  });
});
