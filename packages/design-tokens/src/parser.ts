import type { TokenCategory, TokenEntry } from '@syy-uime/core';
import { classifyValue, normalizeValue } from './normalize.js';

export interface ParseOptions {
  theme?: string;
}

const META_KEYS = new Set(['$themes', '$metadata', '$extensions', '$root']);
// Shared/base sets are always kept regardless of theme selection.
const BASE_SETS = new Set(['global', 'core', 'base', 'primitives', 'primitive', 'theme', 'tailwind', 'tailwindcss', 'cssvars']);

/**
 * Parse a token file into flat TokenEntry records.
 * Auto-detects: W3C DTCG ({$value,$type}), Tokens Studio ({value,type} + named sets), flat name→value maps.
 * Set names (e.g. "primitives", "light") are kept in token paths so alias references resolve.
 * If `theme` is given, tokens from other non-base sets are dropped.
 */
export function parseTokenFile(input: unknown, options: ParseOptions = {}): TokenEntry[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Token file must be a JSON object');
  }
  const root = input as Record<string, unknown>;

  const raw: RawToken[] = [];
  collectTokens(root, [], raw);

  const byPath = new Map(raw.map((t) => [t.path.join('.'), t]));
  const resolved = raw.map((t) => ({ ...t, value: resolveAliases(String(t.value), byPath) }));

  const theme = options.theme?.toLowerCase();
  // Other named sets that sit next to the selected theme (e.g. "dark" next to "light").
  const siblingSets = theme ? themeSiblings(root, theme) : new Set<string>();

  return resolved
    .filter((t) => {
      if (!theme || t.path.length === 0) return true;
      return !t.path.some((segment) => siblingSets.has(segment.toLowerCase()));
    })
    .map((t) => {
      const category = classifyToken(t);
      return {
        name: t.path.join('-'),
        path: t.path,
        category,
        value: t.value,
        normalized: normalizeValue(t.value),
      };
    });
}

function isGroup(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !('value' in (value as object)) &&
    !('$value' in (value as object))
  );
}

/**
 * Find the non-base sibling sets of the theme set — the other named sets at the
 * same level (e.g. "dark" when theme="light"). Works whether theme sets are
 * top-level (Tokens Studio) or nested under a wrapper like cssVars (shadcn).
 */
function themeSiblings(root: Record<string, unknown>, theme: string): Set<string> {
  const siblings = (obj: Record<string, unknown>): Set<string> | null => {
    const keys = Object.keys(obj);
    if (!keys.some((k) => k.toLowerCase() === theme && isGroup(obj[k]))) return null;
    return new Set(
      keys.filter((k) => isGroup(obj[k]) && !BASE_SETS.has(k.toLowerCase()) && k.toLowerCase() !== theme).map((k) => k.toLowerCase()),
    );
  };

  return (
    siblings(root) ??
    Object.values(root)
      .filter(isGroup)
      .map((v) => siblings(v))
      .find((s) => s !== null) ??
    new Set()
  );
}

interface RawToken {
  path: string[];
  name: string;
  type?: string;
  value: string;
}

function collectTokens(node: unknown, path: string[], out: RawToken[], inheritedType?: string): void {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  const obj = node as Record<string, unknown>;

  const value = obj.$value ?? obj.value;
  const type = (obj.$type ?? obj.type) as string | undefined;

  if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
    out.push({ path, name: path.join('-'), type: type ?? inheritedType, value: String(value) });
    return;
  }
  if (value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
    out.push({ path, name: path.join('-'), type: type ?? inheritedType, value: serializeComposite(value as Record<string, unknown>) });
    return;
  }

  const nodeType = type ?? inheritedType;
  for (const [key, child] of Object.entries(obj)) {
    if (META_KEYS.has(key) || key.startsWith('$') || key === 'type') continue;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      collectTokens(child, [...path, key], out, nodeType);
    } else if (typeof child === 'string') {
      // flat map: "primary": "oklch(...)"
      out.push({ path: [...path, key], name: [...path, key].join('-'), type: nodeType, value: child });
    }
  }
}

function serializeComposite(obj: Record<string, unknown>): string {
  const order = ['color', 'x', 'y', 'blur', 'spread', 'offsetx', 'offsety', 'width', 'style'];
  const keys = Object.keys(obj).sort(
    (a, b) =>
      (order.indexOf(a.toLowerCase()) === -1 ? 99 : order.indexOf(a.toLowerCase())) -
      (order.indexOf(b.toLowerCase()) === -1 ? 99 : order.indexOf(b.toLowerCase())),
  );
  return keys.map((k) => String(obj[k])).join(' ');
}

function resolveAliases(value: string, byPath: Map<string, RawToken>, seen = new Set<string>()): string {
  return value.replace(/\{([^}]+)\}/g, (match, ref: string) => {
    const refKey = ref.trim();
    const target = byPath.get(refKey) ?? byPath.get(refKey.replace(/\//g, '.')) ?? findCaseInsensitive(byPath, refKey);
    if (!target || seen.has(refKey)) return match;
    seen.add(refKey);
    return resolveAliases(target.value, byPath, seen);
  });
}

function findCaseInsensitive(map: Map<string, RawToken>, key: string): RawToken | undefined {
  const needle = key.toLowerCase();
  for (const [k, v] of map) {
    if (k.toLowerCase() === needle) return v;
  }
  return undefined;
}

function classifyToken(token: { path: string[]; type?: string; value: string }): TokenCategory {
  const declared = (token.type ?? '').toLowerCase();
  if (declared.includes('color')) return 'color';
  if (declared.includes('radius')) return 'borderRadius';
  if (declared.includes('spacing') || declared.includes('space')) return 'spacing';
  if (declared.includes('fontsize') || declared.includes('font-size')) return 'fontSize';
  if (declared.includes('fontfamil') || declared.includes('font-famil')) return 'fontFamily';
  if (declared.includes('lineheight') || declared.includes('line-height') || declared.includes('leading')) return 'lineHeight';
  if (declared.includes('shadow')) return 'shadow';
  if (declared.includes('dimension') || declared.includes('sizing')) return 'dimension';

  const path = token.path.join('/').toLowerCase();
  const leaf = token.path[token.path.length - 1]?.toLowerCase() ?? '';
  if (path.includes('color') || path.includes('palette')) return 'color';
  if (path.includes('radius') || path.includes('radii') || leaf.startsWith('radius-')) return 'borderRadius';
  if (path.includes('spacing') || path.includes('space')) return 'spacing';
  if (leaf.includes('--line-height') || leaf.startsWith('leading-')) return 'lineHeight';
  if (leaf.startsWith('font-weight')) return 'fontFamily';
  if (leaf.startsWith('font-')) return 'fontFamily';
  if (leaf.startsWith('shadow') || leaf.startsWith('drop-shadow') || leaf.startsWith('inset-shadow')) return 'shadow';
  if (leaf.startsWith('blur-') || leaf.startsWith('breakpoint-') || leaf.startsWith('container-')) return 'dimension';
  if (path.includes('font-size') || path.includes('fontsize') || path.includes('text-size') || leaf.startsWith('text-')) return 'fontSize';
  if (path.includes('font') || path.includes('typeface')) return 'fontFamily';
  if (path.includes('leading') || path.includes('line-height') || path.includes('lineheight')) return 'lineHeight';
  if (path.includes('shadow')) return 'shadow';

  const inferred = classifyValue(token.value);
  return inferred === 'unknown' ? 'other' : inferred;
}
