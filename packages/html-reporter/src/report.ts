import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import type { Assessment, Finding, Dimension } from '@syy-uime/core';
import { confidenceLabel } from '@syy-uime/core';
import { inlineStyles } from './styles.js';
import { inlineScript } from './script.js';

export interface ReportOptions {
  assessmentPath: string;
  outputPath: string;
}

export async function generateHtmlReport(options: ReportOptions): Promise<string> {
  const assessment: Assessment = JSON.parse(await readFile(options.assessmentPath, 'utf-8'));
  const html = renderReport(assessment, options.outputPath);
  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, html, 'utf-8');
  return options.outputPath;
}

export function renderReport(assessment: Assessment, outputPath: string): string {
  const dimensions = Object.values(assessment.dimensions);
  const dimensionNames: Dimension[] = ['functional', 'consistent', 'accessible', 'responsive'];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>syy-uime — ${escapeHtml(assessment.project.name)}</title>
  <style>
    ${inlineStyles}
  </style>
</head>
<body>
  <main class="container">
    <header class="report-header">
      <div class="brand">syy-uime</div>
      <h1>UI Quality Assessment Report</h1>
      <div class="meta">
        <div><strong>Project:</strong> ${escapeHtml(assessment.project.name)}</div>
        <div><strong>URL:</strong> ${escapeHtml(assessment.project.baseUrl)}</div>
        <div><strong>Assessment ID:</strong> ${escapeHtml(assessment.id)}</div>
        <div><strong>Date:</strong> ${new Date(assessment.completedAt).toLocaleString()}</div>
      </div>
    </header>

    <section class="overall">
      <div class="score-card overall-score">
        <div class="score-value">${assessment.overallScore}</div>
        <div class="score-label">Overall Score</div>
        <div class="confidence">Confidence: <strong>${confidenceLabel(assessment.overallConfidence)}</strong> (${assessment.overallConfidence})</div>
      </div>
      <div class="radar">
        ${renderRadarChart(dimensionNames.map((d) => assessment.dimensions[d].score))}
      </div>
    </section>

    <section class="dimensions">
      <h2>Dimension Scores</h2>
      <div class="dimension-grid">
        ${dimensions.map((d) => renderDimensionCard(d)).join('')}
      </div>
    </section>

    <section class="coverage">
      <h2>Coverage Summary</h2>
      <div class="coverage-grid">
        <div class="coverage-item"><span>${assessment.coverage.pagesAssessed}</span> pages assessed</div>
        <div class="coverage-item"><span>${assessment.coverage.routesConfigured}</span> routes configured</div>
        <div class="coverage-item"><span>${assessment.coverage.viewports}</span> viewports</div>
        <div class="coverage-item"><span>${assessment.coverage.screenshotsCaptured}</span> screenshots</div>
        <div class="coverage-item"><span>${assessment.coverage.journeysConfigured}</span> journeys configured</div>
        <div class="coverage-item"><span>${assessment.coverage.journeysExecuted}</span> journeys executed</div>
      </div>
    </section>

    ${assessment.llmAnalysis ? renderLlmAnalysis(assessment.llmAnalysis) : ''}

    <section class="findings">
      <h2>Findings</h2>
      <div class="filters">
        <button class="filter active" data-filter="all">All</button>
        <button class="filter" data-filter="functional">Functional</button>
        <button class="filter" data-filter="consistent">Consistent</button>
        <button class="filter" data-filter="accessible">Accessible</button>
        <button class="filter" data-filter="responsive">Responsive</button>
      </div>
      <div class="findings-list">
        ${renderFindings(assessment, outputPath)}
      </div>
    </section>

    <section class="methodology">
      <h2>Methodology</h2>
      <p>This assessment was generated using deterministic browser-based evidence:</p>
      <ul>
        <li><strong>Playwright</strong> for automated browser navigation, interaction, and viewport simulation.</li>
        <li><strong>Axe Core</strong> for automated WCAG-related accessibility checks. Automated testing cannot establish full WCAG compliance.</li>
        <li><strong>DOM and computed-style analysis</strong> for consistency fingerprinting.</li>
        <li><strong>Geometry measurements</strong> for responsive overflow, clipping, and overlap detection.</li>
        ${assessment.llmAnalysis ? '<li><strong>Gemini</strong> for summarization of findings into recommendations.</li>' : ''}
      </ul>
    </section>
  </main>
  <script>
    ${inlineScript}
  </script>
</body>
</html>`;
}

function renderDimensionCard(dimension: Assessment['dimensions'][Dimension]): string {
  return `
    <div class="dimension-card">
      <div class="dimension-score">${dimension.score}</div>
      <div class="dimension-name">${capitalize(dimension.dimension)}</div>
      <div class="dimension-confidence">Confidence: ${confidenceLabel(dimension.confidence)}</div>
      <div class="dimension-stats">
        <span>${dimension.checksRun} checks</span>
        <span class="failed">${dimension.checksFailed} failed</span>
      </div>
    </div>
  `;
}

function renderFindings(assessment: Assessment, outputPath: string): string {
  const allFindings = Object.values(assessment.dimensions).flatMap((d) => d.findings);

  if (allFindings.length === 0) {
    return '<p class="no-findings">No findings detected.</p>';
  }

  return allFindings
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .map((f) => renderFinding(f, outputPath))
    .join('');
}

function renderFinding(finding: Finding, outputPath: string): string {
  const evidenceSummary = finding.evidence
    .map((e) => e.type)
    .filter(Boolean)
    .join(', ');

  const screenshot = finding.screenshot
    ? `<div class="finding-screenshot"><img src="${relative(dirname(outputPath), finding.screenshot)}" alt="Evidence screenshot" loading="lazy"></div>`
    : '';

  return `
    <article class="finding severity-${finding.severity} dimension-${finding.dimension}" data-dimension="${finding.dimension}">
      <div class="finding-header">
        <span class="severity severity-${finding.severity}">${finding.severity.toUpperCase()}</span>
        <span class="dimension">${capitalize(finding.dimension)}</span>
        <span class="rule">${escapeHtml(finding.ruleId)}</span>
      </div>
      <div class="finding-body">
        <p>${escapeHtml(finding.message)}</p>
        ${finding.selector ? `<p class="selector">Selector: <code>${escapeHtml(finding.selector)}</code></p>` : ''}
        ${finding.page ? `<p class="page">Page: ${escapeHtml(finding.page)}</p>` : ''}
        ${evidenceSummary ? `<p class="evidence">Evidence: ${escapeHtml(evidenceSummary)}</p>` : ''}
        ${screenshot}
      </div>
    </article>
  `;
}

function renderLlmAnalysis(analysis: NonNullable<Assessment['llmAnalysis']>): string {
  return `
    <section class="llm-analysis">
      <h2>Gemini Analysis</h2>
      <div class="executive-summary">
        <h3>Executive Summary</h3>
        <p>${escapeHtml(analysis.executiveSummary)}</p>
      </div>
      ${analysis.recommendations.length > 0 ? `
        <div class="recommendations">
          <h3>Priority Recommendations</h3>
          <ol>
            ${analysis.recommendations.map((r) => `
              <li>
                <span class="rec-priority severity-${r.priority}">${r.priority}</span>
                <strong>${escapeHtml(r.title)}</strong>
                <p>${escapeHtml(r.description)}</p>
              </li>
            `).join('')}
          </ol>
        </div>
      ` : ''}
      ${analysis.patterns.length > 0 ? `
        <div class="patterns">
          <h3>Recurring Patterns</h3>
          <ul>
            ${analysis.patterns.map((p) => `
              <li>
                <strong>${escapeHtml(p.title)}</strong>
                <p>${escapeHtml(p.explanation)}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </section>
  `;
}

function renderRadarChart(scores: number[]): string {
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;
  const labels = ['Functional', 'Consistent', 'Accessible', 'Responsive'];
  const angleStep = (Math.PI * 2) / 4;

  const points = scores.map((score, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (score / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  });

  const labelPoints = labels.map((label, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + (radius + 20) * Math.cos(angle);
    const y = center + (radius + 20) * Math.sin(angle);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="radar-label">${label}</text>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${size} ${size}" class="radar-chart" role="img" aria-label="Dimension score radar chart">
      <circle cx="${center}" cy="${center}" r="${radius * 0.25}" fill="none" stroke="#e5e7eb" />
      <circle cx="${center}" cy="${center}" r="${radius * 0.5}" fill="none" stroke="#e5e7eb" />
      <circle cx="${center}" cy="${center}" r="${radius * 0.75}" fill="none" stroke="#e5e7eb" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#e5e7eb" />
      <polygon points="${points.join(' ')}" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2" />
      ${points.map((p) => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="#3b82f6" />`).join('')}
      ${labelPoints}
    </svg>
  `;
}

function severityRank(severity: Finding['severity']): number {
  const ranks = { blocker: 5, critical: 4, major: 3, minor: 2, info: 1 };
  return ranks[severity];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
