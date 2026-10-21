import type { StyleFingerprint } from '@syy-uime/core';

export interface FingerprintGroup {
  fingerprint: Partial<StyleFingerprint>;
  count: number;
  selectors: string[];
}

export function groupByFingerprint(
  fingerprints: { selector: string; fingerprint: StyleFingerprint }[],
  keys: (keyof StyleFingerprint)[],
): FingerprintGroup[] {
  const map = new Map<string, FingerprintGroup>();

  for (const { selector, fingerprint } of fingerprints) {
    const subset = pick(fingerprint, keys);
    const key = JSON.stringify(subset);
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.selectors.push(selector);
    } else {
      map.set(key, { fingerprint: subset, count: 1, selectors: [selector] });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function findOutliers(
  groups: FingerprintGroup[],
  minGroupSize = 3,
): FingerprintGroup[] {
  if (groups.length <= 1) return [];
  const dominantCount = groups[0].count;
  const ratioThreshold = Math.max(1, Math.floor(dominantCount * 0.25));
  const absoluteThreshold = Math.min(minGroupSize, ratioThreshold);

  return groups.slice(1).filter((g) => g.count <= absoluteThreshold);
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
