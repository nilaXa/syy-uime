import { describe, it, expect } from 'vitest';
import { renderReport, renderRadarChart } from './report.js';
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

  it('renders radar chart with axis lines, rings, and scored labels', () => {
    const svg = renderRadarChart([80, 90, 70, 85]);
    expect(svg.match(/class="radar-axis"/g)).toHaveLength(4);
    expect(svg.match(/class="radar-ring"/g)).toHaveLength(4);
    for (const label of ['Functional', 'Consistent', 'Accessible', 'Responsive']) expect(svg).toContain(label);
  });

  it('keeps radar axis labels inside the SVG viewBox', () => {
    const svg = renderRadarChart([80, 90, 70, 85]);
    const [, width, height] = svg.match(/viewBox="0 0 (\d+) (\d+)"/)!.map(Number);
    const labels = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="(\w+)" class="radar-label">\s*<tspan[^>]*>(\w+)</g)];
    expect(labels).toHaveLength(4);
    for (const [, xs, ys, anchor, text] of labels) {
      const x = Number(xs);
      const y = Number(ys);
      const textWidth = text.length * 9; // generous estimate for 14px font
      const left = anchor === 'end' ? x - textWidth : anchor === 'middle' ? x - textWidth / 2 : x;
      expect(left).toBeGreaterThan(0);
      expect(left + textWidth).toBeLessThan(width);
      expect(y - 14).toBeGreaterThan(0); // name baseline minus font height
      expect(y + 18 + 4).toBeLessThan(height); // score line below name
    }
  });

  it('renders Gemini analysis when present', () => {
    const assessment = sampleAssessment();
    assessment.llmAnalysis = {
      executiveSummary: 'Overall healthy UI.',
      strengths: [{ title: 'Responsive layout', description: 'No overflow.', findingIds: [] }],
      gaps: [],
      recommendations: [{ priority: 'major', title: 'Fix labels', description: 'Add labels.', dimension: 'accessible', findingIds: ['f1'] }],
      patterns: [],
    };
    assessment.llmStatus = { provider: 'gemini', state: 'completed', model: 'gemini-test' };
    const html = renderReport(assessment, '/tmp/report.html');
    expect(html).toContain('Gemini Analysis');
    expect(html).toContain('Overall healthy UI.');
    expect(html).toContain('Fix labels');
    expect(html).toContain('gemini-test');
  });

  it('explains Gemini failures in the report', () => {
    const assessment = sampleAssessment();
    assessment.llmStatus = { provider: 'gemini', state: 'failed', model: 'gemini-test', message: 'GEMINI_API_KEY is not set' };
    const html = renderReport(assessment, '/tmp/report.html');
    expect(html).toContain('did not complete');
    expect(html).toContain('GEMINI_API_KEY is not set');
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
