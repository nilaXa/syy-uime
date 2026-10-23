import { describe, it, expect } from 'vitest';
import { parseResponse, buildPromptPayload, describeApiError, GeminiAnalyzer, DEFAULT_GEMINI_MODEL } from './analyzer.js';
import type { Assessment } from '@syy-uime/core';

describe('parseResponse', () => {
  it('parses a JSON response wrapped in markdown fences', () => {
    const response = parseResponse(`\`\`\`json
{
  "executiveSummary": "Summary",
  "strengths": [],
  "gaps": [],
  "recommendations": [],
  "patterns": []
}
\`\`\``);
    expect(response.executiveSummary).toBe('Summary');
    expect(response.strengths).toEqual([]);
  });

  it('parses a raw JSON response', () => {
    const response = parseResponse('{"executiveSummary":"Raw","strengths":[],"gaps":[],"recommendations":[],"patterns":[]}');
    expect(response.executiveSummary).toBe('Raw');
  });

  it('fills missing sections and sanitizes invalid enum values', () => {
    const response = parseResponse(
      '{"executiveSummary":"S","recommendations":[{"priority":"urgent","title":"T","description":"D","dimension":"speed","findingIds":["a",1]}]}',
    );
    expect(response.strengths).toEqual([]);
    expect(response.gaps).toEqual([]);
    expect(response.patterns).toEqual([]);
    expect(response.recommendations[0]).toEqual({
      priority: 'info',
      title: 'T',
      description: 'D',
      dimension: 'functional',
      findingIds: ['a'],
    });
  });
});

describe('GeminiAnalyzer', () => {
  it('returns undefined without calling Gemini when disabled', async () => {
    await expect(new GeminiAnalyzer({ enabled: false }).analyze({} as Assessment)).resolves.toBeUndefined();
  });

  it('throws a clear error when enabled without an API key', async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(new GeminiAnalyzer({ enabled: true }).analyze({} as Assessment)).rejects.toThrow(/GEMINI_API_KEY/);
    } finally {
      if (previous !== undefined) process.env.GEMINI_API_KEY = previous;
    }
  });

  it('resolves model from options, then GEMINI_MODEL, then default', () => {
    const previous = process.env.GEMINI_MODEL;
    try {
      process.env.GEMINI_MODEL = 'env-model';
      expect(new GeminiAnalyzer({ enabled: true, model: 'config-model' }).model).toBe('config-model');
      expect(new GeminiAnalyzer({ enabled: true }).model).toBe('env-model');
      delete process.env.GEMINI_MODEL;
      expect(new GeminiAnalyzer({ enabled: true }).model).toBe(DEFAULT_GEMINI_MODEL);
    } finally {
      if (previous !== undefined) process.env.GEMINI_MODEL = previous;
      else delete process.env.GEMINI_MODEL;
    }
  });
});

describe('describeApiError', () => {
  it('extracts the message from Gemini JSON error payloads', () => {
    const err = new Error('{"error":{"code":400,"message":"API key not valid.","status":"INVALID_ARGUMENT"}}');
    expect(describeApiError(err)).toBe('INVALID_ARGUMENT: API key not valid.');
  });

  it('falls back to the raw message', () => {
    expect(describeApiError(new Error('fetch failed'))).toBe('fetch failed');
  });
});

describe('buildPromptPayload', () => {
  it('omits raw evidence data and keeps finding references', () => {
    const assessment = {
      project: { name: 'P', baseUrl: 'http://x' },
      overallScore: 80,
      overallConfidence: 1,
      coverage: {},
      dimensions: {
        functional: {
          score: 80, confidence: 1, checksRun: 1, checksFailed: 1, coverageNotes: [],
          findings: [{ id: 'f1', ruleId: 'r', dimension: 'functional', severity: 'major', page: '/', url: 'http://x', message: 'm', confidence: 1, evidence: [{ type: 'geometry', data: { huge: 'x'.repeat(10000) } }] }],
        },
      },
    } as unknown as Assessment;
    const payload = JSON.stringify(buildPromptPayload(assessment));
    expect(payload).toContain('"f1"');
    expect(payload).toContain('"geometry"');
    expect(payload).not.toContain('huge');
  });
});
