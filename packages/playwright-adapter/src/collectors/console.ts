import type { Page, ConsoleMessage } from 'playwright';
import type { Evidence } from '@syy-uime/core';

export interface ConsoleEntry {
  type: 'error' | 'warning' | 'log' | 'info';
  text: string;
  location: string;
  page: string;
  url: string;
}

export function attachConsoleListener(page: Page, pageName: string, url: string): () => Promise<Evidence<ConsoleEntry[]>> {
  const entries: ConsoleMessage[] = [];

  const handler = (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      entries.push(msg);
    }
  };

  page.on('console', handler);

  return async () => {
    page.off('console', handler);

    const relevant = entries.filter((msg) => !isLikelyNoise(msg));
    const data: ConsoleEntry[] = relevant.map((msg) => ({
      type: msg.type() as ConsoleEntry['type'],
      text: msg.text(),
      location: msg.location().url ?? '',
      page: pageName,
      url,
    }));

    return { type: 'console', data } as Evidence<ConsoleEntry[]>;
  };
}

function isLikelyNoise(msg: ConsoleMessage): boolean {
  const text = msg.text().toLowerCase();
  const noisy = [
    'favicon',
    'analytics',
    'google-analytics',
    'gtm',
    'facebook',
    'tracking',
    '[googletagmanager]',
    'font',
    'download the react devtools',
  ];
  return noisy.some((n) => text.includes(n));
}
