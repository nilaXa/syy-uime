import { describe, it, expect } from 'vitest';
import { parseResponse } from './analyzer.js';

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
});
