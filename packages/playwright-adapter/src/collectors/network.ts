import type { Page, Request, Response } from 'playwright';
import type { Evidence } from '@syy-uime/core';

export interface NetworkEntry {
  url: string;
  method: string;
  status: number;
  statusText: string;
  failureText?: string;
  resourceType: string;
  sameOrigin: boolean;
  page: string;
}

export function attachNetworkListener(page: Page, pageName: string): () => Promise<Evidence<NetworkEntry[]>> {
  const failures: NetworkEntry[] = [];

  const handleRequestFailed = (req: Request) => {
    const failure = req.failure();
    if (!failure) return;

    const sameOrigin = isSameOrigin(page.url(), req.url());

    // Skip common third-party noise
    if (!sameOrigin && isThirdPartyNoise(req.url())) return;

    failures.push({
      url: req.url(),
      method: req.method(),
      status: 0,
      statusText: 'FAILED',
      failureText: failure.errorText,
      resourceType: req.resourceType(),
      sameOrigin,
      page: pageName,
    });
  };

  const handleResponse = (res: Response) => {
    const status = res.status();
    if (status >= 400) {
      const sameOrigin = isSameOrigin(page.url(), res.url());
      if (!sameOrigin && isThirdPartyNoise(res.url())) return;

      failures.push({
        url: res.url(),
        method: res.request().method(),
        status,
        statusText: res.statusText(),
        resourceType: res.request().resourceType(),
        sameOrigin,
        page: pageName,
      });
    }
  };

  page.on('requestfailed', handleRequestFailed);
  page.on('response', handleResponse);

  return async () => {
    page.off('requestfailed', handleRequestFailed);
    page.off('response', handleResponse);
    return { type: 'network', data: failures } as Evidence<NetworkEntry[]>;
  };
}

function isSameOrigin(pageUrl: string, requestUrl: string): boolean {
  try {
    return new URL(pageUrl).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}

function isThirdPartyNoise(url: string): boolean {
  const noise = ['analytics', 'google-analytics', 'gtm', 'facebook', 'doubleclick', 'hotjar', 'segment'];
  return noise.some((n) => url.toLowerCase().includes(n));
}
