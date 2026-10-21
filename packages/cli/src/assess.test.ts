import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { loadConfig } from './config.js';
import { runAssessment } from './assess.js';
import type { AssessmentConfig, AssessmentOptions } from '@syy-uime/core';

async function waitForServer(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${url}`);
}

describe('assess integration', () => {
  let server: ReturnType<typeof spawn>;
  const baseUrl = 'http://127.0.0.1:5173';

  const repoRoot = resolve(__dirname, '..', '..', '..');
  const configPath = resolve(repoRoot, 'syy-uime.config.example.yml');

  beforeAll(async () => {
    server = spawn('pnpm', ['--filter', 'fixture-demo-app', 'preview'], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    await waitForServer(baseUrl);
  }, 60000);

  afterAll(() => {
    server?.kill();
  });

  it('detects intentional demo defects', async () => {
    const config = await loadConfig(configPath);
    const options: AssessmentOptions = { configPath, noLlm: true };
    const { assessment, exitCode } = await runAssessment(config, options);

    expect(exitCode).toBe(2); // threshold failure expected
    expect(assessment.overallScore).toBeGreaterThan(0);
    expect(assessment.overallScore).toBeLessThan(100);

    const funcFindings = assessment.dimensions.functional.findings;
    expect(funcFindings.some((f) => f.ruleId === 'journey-execution' && f.message.includes('Submit customer form'))).toBe(true);

    const conFindings = assessment.dimensions.consistent.findings;
    expect(conFindings.some((f) => f.ruleId === 'button-style-variation')).toBe(true);

    const accFindings = assessment.dimensions.accessible.findings;
    expect(accFindings.some((f) => f.ruleId === 'axe-violations')).toBe(true);

    const respFindings = assessment.dimensions.responsive.findings;
    expect(respFindings.some((f) => f.ruleId === 'element-overflow')).toBe(true);
  }, 120000);
});
