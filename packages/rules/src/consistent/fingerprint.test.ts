import { describe, it, expect } from 'vitest';
import { groupByFingerprint, findOutliers } from './fingerprint.js';
import type { StyleFingerprint } from '@syy-uime/core';

function fp(overrides: Partial<StyleFingerprint> = {}): StyleFingerprint {
  return {
    tag: 'button',
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.5',
    color: '#000',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    margin: '0',
    gap: '0',
    width: 'auto',
    height: '40px',
    boxShadow: 'none',
    outline: 'none',
    outlineOffset: '0',
    ...overrides,
  };
}

describe('groupByFingerprint', () => {
  it('groups identical fingerprints', () => {
    const items = [
      { selector: '#a', fingerprint: fp() },
      { selector: '#b', fingerprint: fp() },
      { selector: '#c', fingerprint: fp({ height: '38px' }) },
    ];
    const groups = groupByFingerprint(items, ['height']);
    expect(groups).toHaveLength(2);
    expect(groups[0].count).toBe(2);
    expect(groups[1].count).toBe(1);
  });
});

describe('findOutliers', () => {
  it('returns empty for a single group', () => {
    const groups = [{ fingerprint: { height: '40px' }, count: 5, selectors: [] }];
    expect(findOutliers(groups)).toEqual([]);
  });

  it('flags minority groups', () => {
    const groups = [
      { fingerprint: { height: '40px' }, count: 10, selectors: [] },
      { fingerprint: { height: '38px' }, count: 1, selectors: [] },
    ];
    const outliers = findOutliers(groups, 2);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].fingerprint).toEqual({ height: '38px' });
  });
});
