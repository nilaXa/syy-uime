import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { TokenBaseline, TokenCategory, TokenEntry } from '@syy-uime/core';
import { parseTokenFile, type ParseOptions } from './parser.js';

const CATEGORIES: TokenCategory[] = [
  'color',
  'dimension',
  'borderRadius',
  'fontFamily',
  'fontSize',
  'lineHeight',
  'spacing',
  'shadow',
  'other',
];

export async function loadTokenBaseline(path: string, options: ParseOptions = {}): Promise<TokenBaseline> {
  let json: unknown;
  try {
    json = JSON.parse(await readFile(path, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to load token file "${path}": ${(err as Error).message}`);
  }

  const tokens = parseTokenFile(json, options);
  if (tokens.length === 0) {
    throw new Error(`Token file "${path}" produced no tokens — check the export format.`);
  }

  const byCategory = {} as Record<TokenCategory, TokenEntry[]>;
  for (const c of CATEGORIES) byCategory[c] = [];
  for (const token of tokens) byCategory[token.category].push(token);

  return { source: basename(path), theme: options.theme, tokens, byCategory };
}
