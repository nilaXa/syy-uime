import { describe, it, expect } from 'vitest';
import { loadConfig, validateConfig } from './config.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('loadConfig', () => {
  it('loads a valid YAML configuration', async () => {
    const dir = tmpdir();
    const path = join(dir, `syy-uime-${Date.now()}.yml`);
    await writeFile(
      path,
      `
project:
  name: Test Project
target:
  baseUrl: http://localhost:3000
routes:
  - /
viewports:
  - name: desktop
    width: 1440
    height: 900
`,
    );

    const config = await loadConfig(path);
    expect(config.project.name).toBe('Test Project');
    expect(config.target.baseUrl).toBe('http://localhost:3000');
    expect(config.routes).toEqual(['/']);
  });
});

describe('validateConfig', () => {
  it('returns errors for missing required fields', () => {
    const errors = validateConfig({} as any);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('project.name'))).toBe(true);
  });

  it('passes for a valid configuration', () => {
    const errors = validateConfig({
      project: { name: 'Test' },
      target: { baseUrl: 'http://localhost:3000' },
      routes: ['/'],
      viewports: [{ name: 'desktop', width: 1440, height: 900 }],
    } as any);
    expect(errors).toHaveLength(0);
  });
});
