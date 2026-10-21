import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Assessment,
  AssessmentConfig,
  AssessmentOptions,
  Dimension,
  DimensionAssessment,
  Finding,
  RuleResult,
} from '@syy-uime/core';
import { generateRunId, normalizeDimensions } from '@syy-uime/core';
import { PlaywrightRunner } from '@syy-uime/playwright-adapter';
import { RuleEngine, getRulesForDimensions, flattenFindings, sumChecks } from '@syy-uime/rules';
import {
  calculateScore,
  calculateOverallScore,
  calculateConfidence,
  calculateOverallConfidence,
  buildCoverageSummary,
  evaluateThresholds,
  EXIT_SUCCESS,
  EXIT_THRESHOLD_FAILURE,
} from '@syy-uime/scoring';
import { GeminiAnalyzer } from '@syy-uime/gemini-reporter';
import { generateHtmlReport } from '@syy-uime/html-reporter';

export async function runAssessment(
  config: AssessmentConfig,
  options: AssessmentOptions,
): Promise<{ assessment: Assessment; exitCode: number }> {
  const cwd = process.env.INIT_CWD ?? process.cwd();
  const runId = generateRunId();
  const outputDir = options.output ?? join(cwd, '.syy-uime', 'runs', runId);
  await mkdir(outputDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const dimensions = options.dimensions ?? normalizeDimensions(config.dimensions);
  const runner = new PlaywrightRunner(options.headed);

  try {
    await runner.start(config);
    const runResult = await runner.run(config, options, runId, outputDir);
    await runner.stop();

    const rules = getRulesForDimensions(dimensions);
    const engine = new RuleEngine(rules);

    const dimensionResults: Record<Dimension, { findings: Finding[]; results: RuleResult[] }> = {
      functional: { findings: [], results: [] },
      consistent: { findings: [], results: [] },
      accessible: { findings: [], results: [] },
      responsive: { findings: [], results: [] },
    };

    let totalScreenshots = 0;
    let pagesAssessed = 0;

    for (const pageEvidence of runResult.pages) {
      pagesAssessed++;
      totalScreenshots += pageEvidence.screenshots.length;

      const results = await engine.run({
        page: pageEvidence.page,
        url: pageEvidence.url,
        viewport: pageEvidence.viewport,
        evidence: pageEvidence.evidence,
        screenshots: pageEvidence.screenshots,
      });

      for (const result of results) {
        dimensionResults[result.findings[0]?.dimension ?? 'functional'].results.push(result);
      }
    }

    // Map rule results to dimensions
    for (const dimension of dimensions) {
      const results = dimensionResults[dimension].results;
      const findings = flattenFindings(results);
      dimensionResults[dimension].findings = findings;
    }

    // Add journey evidence to functional dimension
    const journeyEvidence = runResult.journeys.map((j) => ({ type: 'journey-step' as const, data: j }));
    if (journeyEvidence.length > 0) {
      const journeyResults = await engine.run({
        page: 'journey',
        url: config.target.baseUrl,
        viewport: { name: 'journey', width: 0, height: 0 },
        evidence: journeyEvidence,
        screenshots: [],
      });
      dimensionResults.functional.results.push(...journeyResults);
      dimensionResults.functional.findings.push(...flattenFindings(journeyResults));
    }

    const dimensionAssessments: Record<Dimension, DimensionAssessment> = {
      functional: buildDimensionAssessment('functional', dimensionResults.functional.results, {
        pagesAssessed,
        routesConfigured: config.routes.length,
        viewports: config.viewports.length,
        journeysConfigured: config.journeys?.length ?? 0,
        journeysExecuted: runResult.journeys.filter((j) => j.success).length,
      }),
      consistent: buildDimensionAssessment('consistent', dimensionResults.consistent.results, {
        pagesAssessed,
        routesConfigured: config.routes.length,
        viewports: config.viewports.length,
        elementSamples: countStyleSamples(runResult.pages),
      }),
      accessible: buildDimensionAssessment('accessible', dimensionResults.accessible.results, {
        pagesAssessed,
        routesConfigured: config.routes.length,
        viewports: config.viewports.length,
      }),
      responsive: buildDimensionAssessment('responsive', dimensionResults.responsive.results, {
        pagesAssessed,
        routesConfigured: config.routes.length,
        viewports: config.viewports.length,
      }),
    };

    const overallScore = calculateOverallScore({
      functional: dimensionAssessments.functional.score,
      consistent: dimensionAssessments.consistent.score,
      accessible: dimensionAssessments.accessible.score,
      responsive: dimensionAssessments.responsive.score,
    });

    const overallConfidence = calculateOverallConfidence(dimensionAssessments);

    const coverage = buildCoverageSummary(
      config.routes.length,
      countUniquePages(runResult.pages),
      config.viewports.length,
      totalScreenshots,
      config.journeys?.length ?? 0,
      runResult.journeys.length,
    );

    let assessment: Assessment = {
      id: runId,
      project: { name: config.project.name, baseUrl: options.url ?? config.target.baseUrl },
      startedAt,
      completedAt: new Date().toISOString(),
      dimensions: dimensionAssessments,
      overallScore,
      overallConfidence,
      coverage,
    };

    const analyzer = new GeminiAnalyzer({
      enabled: options.noLlm ? false : config.llm?.enabled ?? false,
    });

    try {
      const llmAnalysis = await analyzer.analyze(assessment);
      assessment = { ...assessment, llmAnalysis };
    } catch (err) {
      if (config.llm?.enabled) {
        console.warn(`Gemini analysis skipped: ${(err as Error).message}`);
      }
    }

    const assessmentPath = join(outputDir, 'assessment.json');
    await writeFile(assessmentPath, JSON.stringify(assessment, null, 2), 'utf-8');

    const reportPath = join(outputDir, 'report.html');
    await generateHtmlReport({ assessmentPath, outputPath: reportPath });

    const thresholdResult = evaluateThresholds(assessment, config.thresholds);

    return {
      assessment,
      exitCode: thresholdResult.passed ? EXIT_SUCCESS : EXIT_THRESHOLD_FAILURE,
    };
  } catch (err) {
    await runner.stop().catch(() => {});
    throw err;
  }
}

function buildDimensionAssessment(
  dimension: Dimension,
  results: RuleResult[],
  coverageInputs: Record<string, number>,
): DimensionAssessment {
  const findings = flattenFindings(results);
  const checks = sumChecks(results);

  const confidence = calculateConfidence({
    dimension,
    pagesAssessed: coverageInputs.pagesAssessed ?? 0,
    routesConfigured: coverageInputs.routesConfigured ?? 0,
    viewports: coverageInputs.viewports ?? 0,
    journeysConfigured: coverageInputs.journeysConfigured ?? 0,
    journeysExecuted: coverageInputs.journeysExecuted ?? 0,
    elementSamples: coverageInputs.elementSamples ?? 0,
  });

  return {
    dimension,
    score: calculateScore(findings),
    confidence,
    checksRun: checks.run,
    checksPassed: checks.passed,
    checksFailed: checks.failed,
    findings,
    coverageNotes: [buildCoverageNote(dimension, coverageInputs)],
  };
}

function buildCoverageNote(dimension: Dimension, inputs: Record<string, number>): string {
  switch (dimension) {
    case 'functional':
      return `${inputs.journeysExecuted ?? 0} of ${inputs.journeysConfigured ?? 0} journeys executed`;
    case 'consistent':
      return `${inputs.elementSamples ?? 0} style samples analyzed`;
    case 'accessible':
      return `${inputs.pagesAssessed ?? 0} pages × ${inputs.viewports ?? 0} viewports scanned`;
    case 'responsive':
      return `${inputs.pagesAssessed ?? 0} pages × ${inputs.viewports ?? 0} viewports measured`;
  }
}

function countStyleSamples(pages: { evidence: Array<{ type: string; data?: unknown }> }[]): number {
  let total = 0;
  for (const page of pages) {
    for (const evidence of page.evidence) {
      if (evidence.type === 'computed-style') {
        const data = evidence.data as { entries?: unknown[] } | undefined;
        if (data && Array.isArray(data.entries)) {
          total += data.entries.length;
        }
      }
    }
  }
  return total;
}

function countUniquePages(pages: { page: string }[]): number {
  return new Set(pages.map((p) => p.page)).size;
}
