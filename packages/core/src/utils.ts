import { randomBytes } from 'node:crypto';
import type { Dimension, Severity, DimensionToggleConfig } from './types.js';

export function generateId(prefix = ''): string {
  const bytes = randomBytes(6).toString('hex');
  return prefix ? `${prefix}-${bytes}` : bytes;
}

export function generateRunId(): string {
  const date = new Date();
  const y = date.getFullYear();
  const startOfYear = new Date(y, 0, 0).getTime();
  const d = Math.floor((date.getTime() - startOfYear) / (1000 * 60 * 60 * 24));
  return `UI-VAL-${y}-${d.toString().padStart(3, '0')}-${generateId()}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toISOString();
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

export function severityRank(severity: Severity): number {
  const ranks: Record<Severity, number> = {
    blocker: 5,
    critical: 4,
    major: 3,
    minor: 2,
    info: 1,
  };
  return ranks[severity];
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}

export function normalizeDimensions(
  dimensions: DimensionToggleConfig | undefined,
): Dimension[] {
  const defaults: Dimension[] = ['functional', 'consistent', 'accessible', 'responsive'];
  if (!dimensions) return defaults;
  return defaults.filter((d) => dimensions[d] !== false);
}

export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
