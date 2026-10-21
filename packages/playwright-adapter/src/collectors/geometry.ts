import type { Page } from 'playwright';
import type { Evidence, ElementGeometry, CollectorContext, GeometryCollection, DocumentGeometry } from '@syy-uime/core';

export async function collectGeometry(
  page: Page,
  context: CollectorContext,
): Promise<Evidence<GeometryCollection>> {
  const { document: documentGeometry, elements } = await page.evaluate((): {
    document: DocumentGeometry;
    elements: ElementGeometry[];
  } => {
    const collected: ElementGeometry[] = [];
    const selectors = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'label',
      'table',
      'nav',
      '[role="dialog"]',
      '[role="alert"]',
      '[class*="card"]',
    ];

    const nodes = Array.from(document.querySelectorAll(selectors.join(', ')));

    for (const node of nodes) {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;

      if (!visible) continue;

      collected.push({
        selector: getSelector(el),
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || undefined,
        accessibleName: (el as HTMLElement).ariaLabel || el.getAttribute('aria-label') || undefined,
        boundingRect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        },
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        visible,
      });
    }

    const docEl = document.documentElement;
    const documentMetrics: DocumentGeometry = {
      scrollWidth: docEl.scrollWidth,
      scrollHeight: docEl.scrollHeight,
      clientWidth: docEl.clientWidth,
      clientHeight: docEl.clientHeight,
      hasHorizontalOverflow: docEl.scrollWidth > docEl.clientWidth,
    };

    function getSelector(el: HTMLElement): string {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList).join('.');
      return classes ? `${tag}.${classes}` : tag;
    }

    return { document: documentMetrics, elements: collected };
  });

  return {
    type: 'geometry',
    data: { page: context.page, viewport: context.viewport.name, document: documentGeometry, elements },
  };
}
