import type { Page } from 'playwright';
import type { Evidence, CollectorContext, ComputedStyleEntry, StyleCollection } from '@syy-uime/core';

const STYLE_PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'background-color',
  'border',
  'border-radius',
  'padding',
  'margin',
  'gap',
  'width',
  'height',
  'box-shadow',
  'outline',
  'outline-offset',
];

export async function collectStyles(
  page: Page,
  context: CollectorContext,
): Promise<Evidence<StyleCollection>> {
  const data = await page.evaluate((properties): ComputedStyleEntry[] => {
    const entries: ComputedStyleEntry[] = [];
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
      'label',
      '[class*="card"]',
      '[class*="alert"]',
      '[role="button"]',
      '[role="dialog"]',
    ];

    const nodes = Array.from(document.querySelectorAll(selectors.join(', ')));

    for (const node of nodes) {
      const el = node as HTMLElement;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (rect.width === 0 || rect.height === 0) continue;

      const computed: Record<string, string> = {};
      for (const prop of properties) {
        computed[prop] = style.getPropertyValue(prop);
      }

      entries.push({
        selector: getSelector(el),
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || undefined,
        accessibleRole: (el as HTMLElement).ariaLabel || undefined,
        fingerprint: {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || undefined,
          accessibleRole: el.getAttribute('aria-label') || undefined,
          fontFamily: computed['font-family'] ?? '',
          fontSize: computed['font-size'] ?? '',
          fontWeight: computed['font-weight'] ?? '',
          lineHeight: computed['line-height'] ?? '',
          color: computed['color'] ?? '',
          backgroundColor: computed['background-color'] ?? '',
          border: computed['border'] ?? '',
          borderRadius: computed['border-radius'] ?? '',
          padding: computed['padding'] ?? '',
          margin: computed['margin'] ?? '',
          gap: computed['gap'] ?? '',
          width: computed['width'] ?? '',
          height: computed['height'] ?? '',
          boxShadow: computed['box-shadow'] ?? '',
          outline: computed['outline'] ?? '',
          outlineOffset: computed['outline-offset'] ?? '',
        },
      });
    }

    return entries;

    function getSelector(el: HTMLElement): string {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList).join('.');
      return classes ? `${tag}.${classes}` : tag;
    }
  }, STYLE_PROPERTIES);

  return {
    type: 'computed-style',
    data: { page: context.page, viewport: context.viewport.name, entries: data },
  };
}
