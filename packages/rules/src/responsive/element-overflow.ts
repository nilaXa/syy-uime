import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { GeometryCollection } from '@syy-uime/core';
import { createFinding } from '../finding.js';

const IGNORED_TAGS = new Set(['script', 'style', 'meta', 'link', 'noscript', 'html', 'body']);

export const elementOverflowRule: Rule = {
  id: 'element-overflow',
  dimension: 'responsive',
  requiredEvidence: ['geometry'],
  execute(context: RuleContext): RuleResult {
    const geometryEvidence = context.evidence.find((e) => e.type === 'geometry') as
      | Evidence<GeometryCollection>
      | undefined;

    const findings: Finding[] = [];

    if (!geometryEvidence) {
      return { findings, checksRun: 0, checksPassed: 0, checksFailed: 0 };
    }

    const screenshot = context.screenshots[0];
    const viewportWidth = context.viewport.width;
    const elements = geometryEvidence.data.elements.filter((el) => !IGNORED_TAGS.has(el.tag));

    for (const el of elements) {
      const overflow = Math.round(el.boundingRect.right - viewportWidth);
      if (overflow > 10) {
        findings.push(
          createFinding({
            ruleId: 'element-overflow',
            dimension: 'responsive',
            severity: el.tag === 'table' ? 'major' : 'minor',
            page: context.page,
            url: context.url,
            selector: el.selector,
            message: `Element extends ${overflow}px beyond the ${viewportWidth}px viewport (right edge at ${Math.round(el.boundingRect.right)}px).`,
            actual: { boundingRect: el.boundingRect, viewportWidth },
            evidence: [{ type: 'geometry', data: { page: context.page, viewport: context.viewport.name, selector: el.selector, overflow } }],
            screenshot,
          }),
        );
      }

      // Flag clipping only when scroll dimension is meaningfully larger and overflow is hidden
      if (el.overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 10) {
        findings.push(
          createFinding({
            ruleId: 'element-overflow',
            dimension: 'responsive',
            severity: 'minor',
            page: context.page,
            url: context.url,
            selector: el.selector,
            message: `Element content is clipped horizontally (scrollWidth ${el.scrollWidth}px > clientWidth ${el.clientWidth}px).`,
            actual: { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth },
            evidence: [{ type: 'geometry', data: { page: context.page, viewport: context.viewport.name, selector: el.selector } }],
            screenshot,
          }),
        );
      }
    }

    return {
      findings,
      checksRun: elements.length,
      checksPassed: elements.length - findings.length,
      checksFailed: findings.length,
    };
  },
};
