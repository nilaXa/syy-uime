import type { Page } from 'playwright';
import type { Evidence, CollectorContext, DomSnapshot } from '@syy-uime/core';

export async function collectDom(
  page: Page,
  context: CollectorContext,
): Promise<Evidence<DomSnapshot>> {
  const data = await page.evaluate((): Omit<DomSnapshot, 'page' | 'url' | 'viewport'> => {
    const doc = document.documentElement;
    return {
      title: document.title,
      headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      linkCount: document.querySelectorAll('a').length,
      buttonCount: document.querySelectorAll('button, [role="button"]').length,
      inputCount: document.querySelectorAll('input, select, textarea').length,
      landmarkCount: document.querySelectorAll('header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]').length,
      lang: doc.lang || undefined,
    };
  });

  return {
    type: 'dom',
    data: { ...data, page: context.page, url: context.url, viewport: context.viewport.name },
  };
}
