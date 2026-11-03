import type { TokenEntry, TokenCategory } from '@syy-uime/core';

const COLOR_FN = /^(oklch|oklab|lab|lch|hsl|hsla|rgb|rgba|color|hwb|gray)\s*\(/i;
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
const LENGTH = /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|pt|fr|deg|ms|s)$/i;
const FN_RE = /^([a-z-]+)\((.*)\)$/i;

/** Normalize a value for strict (exact) comparison: lowercase, collapse whitespace, canonicalize numbers. */
export function normalizeValue(value: string): string {
  const v = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const fn = v.match(FN_RE);
  if (fn) {
    // Canonicalize every number in place; separators and units are preserved.
    const canonical = fn[2]
      .replace(/-?\d*\.?\d+/g, (num) => String(parseFloat(num)))
      .replace(/,\s+/g, ',');
    return `${fn[1]}(${canonical})`;
  }
  // plain dimension / number: normalize numeric precision, convert rem/em → px (16px base)
  const m = v.match(/^(-?[\d.]+)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|pt)?$/);
  if (m) {
    const num = parseFloat(m[1]);
    const unit = m[2] ?? '';
    if (unit === 'rem' || unit === 'em') return `${num * 16}px`;
    return `${num}${unit}`;
  }
  return v;
}

export function classifyValue(value: string): TokenCategory | 'unknown' {
  const v = value.trim().toLowerCase();
  if (COLOR_FN.test(v) || HEX_COLOR.test(v)) return 'color';
  if (LENGTH.test(v)) return 'dimension';
  if (/^[-\d.]+\s/.test(v) || v.split(' ').length > 2) {
    // possible shorthand like "0.5rem 1rem" → still dimension family
    const parts = v.split(' ');
    if (parts.every((p) => LENGTH.test(p))) return 'dimension';
  }
  if (/^[-\d.]+$/.test(v)) return 'dimension';
  return 'unknown';
}

const SYSTEM_FONT_ALIASES = new Set(['-apple-system', 'blinkmacsystemfont', 'system-ui', 'system-ui-sans-serif']);

/**
 * Normalize a font-family list: lowercase, unquote, dedupe, and canonicalize
 * platform-reserved names (-apple-system / BlinkMacSystemFont / system-ui).
 */
export function normalizeFontFamilyList(value: string): string {
  return value
    .split(',')
    .map((f) => f.trim().toLowerCase().replace(/^["']|["']$/g, ''))
    .map((f) => (SYSTEM_FONT_ALIASES.has(f) ? 'system-ui' : f))
    .filter((f, i, arr) => f && arr.indexOf(f) === i)
    .join(',');
}

/** Font-family-aware exact match. */
export function matchFontFamily(entries: TokenEntry[], value: string): TokenEntry | undefined {
  const needle = normalizeFontFamilyList(value);
  if (!needle) return undefined;
  return entries.find((t) => normalizeFontFamilyList(t.value) === needle);
}

/** Exact-match a value against token entries (normalized exact match). */
export function matchToken(entries: TokenEntry[], value: string): TokenEntry | undefined {
  const needle = normalizeValue(value);
  if (!needle) return undefined;
  return entries.find((t) => t.normalized === needle);
}

interface OklchParts {
  l: number;
  c: number;
  h: number;
}

function parseOklch(value: string): OklchParts | undefined {
  const m = value.trim().match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return undefined;
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
}

/**
 * Nearest-token suggestion used only for the "expected" field in findings.
 * Colors compare in OKLCH space; lengths compare numerically.
 */
export function nearestToken(entries: TokenEntry[], value: string): TokenEntry | undefined {
  if (entries.length === 0) return undefined;

  const oklch = parseOklch(value);
  if (oklch) {
    let best: TokenEntry | undefined;
    let bestDist = Infinity;
    for (const entry of entries) {
      const other = parseOklch(entry.value);
      if (!other) continue;
      const dist = Math.abs(other.l - oklch.l) * 2 + Math.abs(other.c - oklch.c) + Math.abs(angleDiff(other.h, oklch.h)) / 360;
      if (dist < bestDist) {
        bestDist = dist;
        best = entry;
      }
    }
    return best ?? entries[0];
  }

  const len = value.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);
  if (len) {
    const target = Number(len[1]);
    let best: TokenEntry | undefined;
    let bestDist = Infinity;
    for (const entry of entries) {
      const m = entry.value.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);
      if (!m) continue;
      const dist = Math.abs(Number(m[1]) - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = entry;
      }
    }
    return best ?? entries[0];
  }

  // string similarity fallback for font families etc.
  const needle = value.toLowerCase();
  return (
    entries.find((e) => needle.includes(e.name.toLowerCase())) ??
    entries.find((e) => e.name.toLowerCase().includes(needle.split(/[\s,]/)[0])) ??
    entries[0]
  );
}

/**
 * Tolerance match (used when designSystem.strict=false): OKLCH within a small
 * perceptual distance, or lengths within 1px in the same unit.
 */
export function matchTokenTolerance(entries: TokenEntry[], value: string): TokenEntry | undefined {
  const oklch = parseOklch(value);
  if (oklch) {
    for (const entry of entries) {
      const other = parseOklch(entry.value);
      if (!other) continue;
      const dist = Math.abs(other.l - oklch.l) * 2 + Math.abs(other.c - oklch.c) + angleDiff(other.h, oklch.h) / 360;
      if (dist <= 0.05) return entry;
    }
    return undefined;
  }
  const len = value.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);
  if (len) {
    const target = Number(len[1]);
    const unit = len[2] ?? '';
    for (const entry of entries) {
      const m = entry.value.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);
      if (m && (m[2] ?? '') === unit && Math.abs(Number(m[1]) - target) <= 1) return entry;
    }
  }
  return undefined;
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
