import { describe, it, expect } from 'vitest';
import { documentOverflowRule } from './document-overflow.js';
import type { RuleContext, Evidence, GeometryCollection } from '@syy-uime/core';

function context(collection: GeometryCollection): RuleContext {
  return {
    page: 'home',
    url: 'http://localhost/',
    viewport: { name: 'mobile', width: 375, height: 812 },
    evidence: [{ type: 'geometry', data: collection }],
    screenshots: [],
    config: {} as any,
  };
}

describe('documentOverflowRule', () => {
  it('flags horizontal document overflow', () => {
    const collection: GeometryCollection = {
      page: 'home',
      viewport: 'mobile',
      document: { scrollWidth: 800, scrollHeight: 1000, clientWidth: 375, clientHeight: 812, hasHorizontalOverflow: true },
      elements: [],
    };
    const result = documentOverflowRule.execute(context(collection));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].severity).toBe('major');
  });

  it('passes when there is no overflow', () => {
    const collection: GeometryCollection = {
      page: 'home',
      viewport: 'mobile',
      document: { scrollWidth: 375, scrollHeight: 1000, clientWidth: 375, clientHeight: 812, hasHorizontalOverflow: false },
      elements: [],
    };
    const result = documentOverflowRule.execute(context(collection));
    expect(result.findings).toHaveLength(0);
    expect(result.checksPassed).toBe(1);
  });
});
