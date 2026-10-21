import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Page } from 'playwright';
import type { Evidence, CollectorContext } from '@syy-uime/core';

export async function captureScreenshot(
  page: Page,
  context: CollectorContext,
  name: string,
): Promise<string> {
  const dir = join(context.outputDir, 'screenshots', context.runId);
  await mkdir(dir, { recursive: true });
  const filename = `${sanitize(name)}-${context.viewport.name}.png`;
  const path = join(dir, filename);
  await page.screenshot({ path, fullPage: true });
  return path;
}

export function screenshotEvidence(path: string): Evidence<{ path: string }> {
  return { type: 'screenshot', data: { path } };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
}
