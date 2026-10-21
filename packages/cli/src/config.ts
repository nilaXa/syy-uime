import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import type { AssessmentConfig, ViewportConfig, JourneyConfig, ThresholdConfig, DimensionToggleConfig, AuthenticationConfig, LlmConfig } from '@syy-uime/core';
import { sanitizeUrl } from '@syy-uime/core';

export async function loadConfig(path: string): Promise<AssessmentConfig> {
  const cwd = process.env.INIT_CWD ?? process.cwd();
  const absolutePath = resolve(cwd, path);
  const raw = await readFile(absolutePath, 'utf-8');
  const parsed = yaml.load(raw) as Record<string, unknown>;
  return normalizeConfig(parsed);
}

export function validateConfig(config: AssessmentConfig): string[] {
  const errors: string[] = [];

  if (!config.project?.name) errors.push('project.name is required');
  if (!config.target?.baseUrl) errors.push('target.baseUrl is required');
  if (!config.routes || config.routes.length === 0) errors.push('routes must contain at least one route');
  if (!config.viewports || config.viewports.length === 0) errors.push('viewports must contain at least one viewport');

  for (const viewport of config.viewports ?? []) {
    if (!viewport.name || viewport.width === undefined || viewport.height === undefined) {
      errors.push(`viewport is missing name, width, or height: ${JSON.stringify(viewport)}`);
    }
  }

  return errors;
}

function normalizeConfig(raw: Record<string, unknown>): AssessmentConfig {
  const project = raw.project as { name: string };
  const target = raw.target as { baseUrl: string };

  return {
    project: { name: project.name ?? 'Untitled Project' },
    target: { baseUrl: sanitizeUrl(target.baseUrl ?? 'http://localhost:3000') },
    authentication: normalizeAuthentication(raw.authentication),
    routes: Array.isArray(raw.routes) ? raw.routes.map((r) => String(r)) : ['/'],
    viewports: normalizeViewports(raw.viewports),
    dimensions: normalizeDimensions(raw.dimensions as DimensionToggleConfig | undefined),
    thresholds: normalizeThresholds(raw.thresholds),
    journeys: normalizeJourneys(raw.journeys),
    llm: normalizeLlm(raw.llm),
  };
}

function normalizeAuthentication(raw: unknown): AuthenticationConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const auth = raw as AuthenticationConfig;
  return auth.storageState ? { storageState: auth.storageState } : undefined;
}

function normalizeViewports(raw: unknown): ViewportConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ name: 'desktop', width: 1440, height: 900 }];
  }

  return raw.map((v) => ({
    name: String(v.name),
    width: Number(v.width),
    height: Number(v.height),
  }));
}

function normalizeDimensions(raw: DimensionToggleConfig | undefined): DimensionToggleConfig {
  return {
    functional: raw?.functional !== false,
    consistent: raw?.consistent !== false,
    accessible: raw?.accessible !== false,
    responsive: raw?.responsive !== false,
  };
}

function normalizeThresholds(raw: unknown): ThresholdConfig {
  if (!raw || typeof raw !== 'object') return {};
  const thresholds = raw as Record<string, unknown>;
  return {
    overall: thresholds.overall !== undefined ? Number(thresholds.overall) : undefined,
    functional: thresholds.functional !== undefined ? Number(thresholds.functional) : undefined,
    consistent: thresholds.consistent !== undefined ? Number(thresholds.consistent) : undefined,
    accessible: thresholds.accessible !== undefined ? Number(thresholds.accessible) : undefined,
    responsive: thresholds.responsive !== undefined ? Number(thresholds.responsive) : undefined,
  };
}

function normalizeJourneys(raw: unknown): JourneyConfig[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((j) => ({
    name: String(j.name),
    start: String(j.start),
    steps: Array.isArray(j.steps) ? j.steps : [],
  }));
}

function normalizeLlm(raw: unknown): LlmConfig {
  if (!raw || typeof raw !== 'object') return { enabled: false };
  return { enabled: (raw as LlmConfig).enabled === true };
}
