import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from 'playwright';
import type { Evidence, CollectorContext, AxeResultEntry } from '@syy-uime/core';

interface RawAxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    target: string | string[];
    html: string;
    failureSummary?: string;
  }[];
}

export async function collectAxe(
  page: Page,
  context: CollectorContext,
): Promise<Evidence<AxeResultEntry[]>> {
  const results = (await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()) as unknown as { violations: RawAxeViolation[] };

  const entries: AxeResultEntry[] = results.violations.map((violation) => ({
    ruleId: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node) => ({
      target: Array.isArray(node.target) ? node.target.map(String) : [String(node.target)],
      html: node.html,
      failureSummary: node.failureSummary,
    })),
    page: context.page,
    viewport: context.viewport.name,
  }));

  return {
    type: 'axe',
    data: entries,
  } as Evidence<AxeResultEntry[]>;
}
