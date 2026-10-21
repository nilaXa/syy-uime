import type { Rule, RuleContext, RuleResult, Evidence, Finding } from '@syy-uime/core';
import type { GeometryCollection, ElementGeometry } from '@syy-uime/core';
import { createFinding } from '../finding.js';

const IGNORED_TAGS = new Set(['script', 'style', 'meta', 'link', 'noscript', 'span', 'i', 'svg', 'img']);

export const elementOverlapRule: Rule = {
  id: 'element-overlap',
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

    const elements = geometryEvidence.data.elements.filter(
      (el) => !IGNORED_TAGS.has(el.tag) && el.visible && el.boundingRect.width > 20 && el.boundingRect.height > 20,
    );

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];
        if (isParentChild(a, b)) continue;
        if (!rectsOverlap(a.boundingRect, b.boundingRect)) continue;

        const overlapArea = computeOverlapArea(a.boundingRect, b.boundingRect);
        const minArea = Math.min(
          a.boundingRect.width * a.boundingRect.height,
          b.boundingRect.width * b.boundingRect.height,
        );
        // Only flag when a large portion of the smaller element overlaps unexpectedly
        if (overlapArea / minArea < 0.5) continue;

        findings.push(
          createFinding({
            ruleId: 'element-overlap',
            dimension: 'responsive',
            severity: 'minor',
            page: context.page,
            url: context.url,
            selector: `${a.selector}, ${b.selector}`,
            message: `Significant visible elements overlap: ${a.selector} and ${b.selector}`,
            actual: { a: a.boundingRect, b: b.boundingRect, overlapArea },
            evidence: [{ type: 'geometry', data: { page: context.page, viewport: context.viewport.name, overlap: { a: a.selector, b: b.selector } } }],
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

function rectsOverlap(
  a: ElementGeometry['boundingRect'],
  b: ElementGeometry['boundingRect'],
): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function computeOverlapArea(
  a: ElementGeometry['boundingRect'],
  b: ElementGeometry['boundingRect'],
): number {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function isParentChild(a: ElementGeometry, b: ElementGeometry): boolean {
  return contains(a.boundingRect, b.boundingRect) || contains(b.boundingRect, a.boundingRect);
}

function contains(
  outer: ElementGeometry['boundingRect'],
  inner: ElementGeometry['boundingRect'],
): boolean {
  return (
    outer.left <= inner.left + 1 &&
    outer.right >= inner.right - 1 &&
    outer.top <= inner.top + 1 &&
    outer.bottom >= inner.bottom - 1
  );
}
