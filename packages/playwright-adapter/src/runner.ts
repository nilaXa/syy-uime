import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { AssessmentConfig, AssessmentOptions, Evidence, CollectorContext, ViewportConfig } from '@syy-uime/core';
import { collectDom } from './collectors/dom.js';
import { attachConsoleListener } from './collectors/console.js';
import { attachNetworkListener } from './collectors/network.js';
import { collectGeometry } from './collectors/geometry.js';
import { collectStyles } from './collectors/styles.js';
import { collectAxe } from './collectors/axe.js';
import { collectKeyboardFlow } from './collectors/keyboard.js';
import { captureScreenshot } from './collectors/screenshot.js';
import { runJourney, type JourneyResult } from './journey.js';

export interface PageEvidence {
  page: string;
  url: string;
  viewport: ViewportConfig;
  evidence: Evidence[];
  screenshots: string[];
}

export interface RunResult {
  pages: PageEvidence[];
  journeys: JourneyResult[];
}

export class PlaywrightRunner {
  private browser?: Browser;
  private context?: BrowserContext;
  private headed: boolean;

  constructor(headed = false) {
    this.headed = headed;
  }

  async start(config: AssessmentConfig): Promise<void> {
    this.browser = await chromium.launch({ headless: !this.headed });
    const options: Parameters<Browser['newContext']>[0] = {};
    if (config.authentication?.storageState) {
      options.storageState = config.authentication.storageState;
    }
    this.context = await this.browser.newContext(options);
  }

  async stop(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }

  async run(config: AssessmentConfig, options: AssessmentOptions, runId: string, outputDir: string): Promise<RunResult> {
    const baseUrl = options.url ?? config.target.baseUrl;
    const viewports = config.viewports.length > 0 ? config.viewports : [{ name: 'desktop', width: 1440, height: 900 }];
    const routes = config.routes.length > 0 ? config.routes : ['/'];

    await mkdir(join(outputDir, 'evidence', runId), { recursive: true });

    const pages: PageEvidence[] = [];

    for (const route of routes) {
      for (const viewport of viewports) {
        const pageEvidence = await this.assessPage({
          baseUrl,
          route,
          viewport,
          runId,
          outputDir,
        });
        pages.push(pageEvidence);
      }
    }

    const journeys: JourneyResult[] = [];
    if (config.journeys && config.journeys.length > 0) {
      const page = await this.context!.newPage();
      for (const journey of config.journeys) {
        const result = await runJourney(page, journey, baseUrl);
        journeys.push(result);
      }
      await page.close();
    }

    return { pages, journeys };
  }

  private async assessPage(params: {
    baseUrl: string;
    route: string;
    viewport: ViewportConfig;
    runId: string;
    outputDir: string;
  }): Promise<PageEvidence> {
    const { baseUrl, route, viewport, runId, outputDir } = params;
    const url = new URL(route, baseUrl).toString();
    const pageName = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');

    const page = await this.context!.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    const evidence: Evidence[] = [];
    const screenshots: string[] = [];

    const detachConsole = attachConsoleListener(page, pageName, url);
    const detachNetwork = attachNetworkListener(page, pageName);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch {
      evidence.push({
        type: 'network',
        data: [{ url, method: 'GET', status: 0, statusText: 'NAVIGATION_FAILED', sameOrigin: true, page: pageName }],
      });
    }

    const collectorContext: CollectorContext = {
      page: pageName,
      url,
      viewport,
      runId,
      outputDir,
    };

    evidence.push(await collectDom(page, collectorContext));
    evidence.push(await collectGeometry(page, collectorContext));
    evidence.push(await collectStyles(page, collectorContext));
    evidence.push(await collectAxe(page, collectorContext));
    evidence.push(await collectKeyboardFlow(page, collectorContext));

    const screenshotPath = await captureScreenshot(page, collectorContext, pageName);
    screenshots.push(screenshotPath);

    evidence.push(await detachConsole());
    evidence.push(await detachNetwork());

    await page.close();

    return { page: pageName, url, viewport, evidence, screenshots };
  }
}
