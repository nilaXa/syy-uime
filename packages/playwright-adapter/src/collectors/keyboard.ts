import type { Page } from 'playwright';
import type { Evidence, CollectorContext, KeyboardFlowResult } from '@syy-uime/core';

export async function collectKeyboardFlow(
  page: Page,
  context: CollectorContext,
): Promise<Evidence<KeyboardFlowResult>> {
  const initialFocusable = await page.evaluate((): number => {
    const interactive = Array.from(
      document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ) as HTMLElement[];
    return interactive.filter((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;
  });

  const reached: string[] = [];
  const maxTabs = Math.min(initialFocusable, 5) + 2;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate((): string => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return '';
      const tag = el.tagName.toLowerCase();
      const id = el.id;
      return id ? `${tag}#${id}` : tag;
    });
    if (active && !reached.includes(active)) {
      reached.push(active);
    }
  }

  const uniqueReached = new Set(reached).size;
  const result: KeyboardFlowResult = {
    page: context.page,
    viewport: context.viewport.name,
    initialFocusable,
    reachedElements: reached,
    focusTrapped: initialFocusable > 1 && uniqueReached === 1,
    focusReturned: false,
    escapeWorked: false,
    notes: ['Keyboard flow tested via Playwright Tab input.'],
  };

  return { type: 'keyboard', data: result } as Evidence<KeyboardFlowResult>;
}
