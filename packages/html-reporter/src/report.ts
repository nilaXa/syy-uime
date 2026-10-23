import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import type { Assessment, Finding, Dimension, DimensionAssessment, Severity, LlmAnalysis } from '@syy-uime/core';
import { confidenceLabel } from '@syy-uime/core';
import { inlineStyles } from './styles.js';
import { inlineScript } from './script.js';

export interface ReportOptions {
  assessmentPath: string;
  outputPath: string;
}

const DIMENSIONS: Dimension[] = ['functional', 'consistent', 'accessible', 'responsive'];
const SEVERITIES: Severity[] = ['blocker', 'critical', 'major', 'minor', 'info'];

export async function generateHtmlReport(options: ReportOptions): Promise<string> {
  const assessment: Assessment = JSON.parse(await readFile(options.assessmentPath, 'utf-8'));
  const html = renderReport(assessment, options.outputPath);
  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, html, 'utf-8');
  return options.outputPath;
}

export function renderReport(assessment: Assessment, outputPath: string): string {
  const findings = allFindings(assessment);
  const coverage = assessment.coverage;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>syy-uime — ${escapeHtml(assessment.project.name)}</title>
  <style>${inlineStyles}</style>
</head>
<body>
  <main class="container">
    <header class="report-header">
      <div>
        <div class="brand">syy-uime</div>
        <h1>UI Quality Assessment Report</h1>
      </div>
      <dl class="meta">
        ${metaItem('Project', escapeHtml(assessment.project.name))}
        ${metaItem('URL', `<a href="${escapeHtml(assessment.project.baseUrl)}">${escapeHtml(assessment.project.baseUrl)}</a>`)}
        ${metaItem('Assessment ID', `<code>${escapeHtml(assessment.id)}</code>`)}
        ${metaItem('Date', escapeHtml(new Date(assessment.completedAt).toLocaleString()))}
      </dl>
    </header>

    <section class="hero card">
      <div class="overall-score">
        <div class="eyebrow">Overall Score</div>
        <div class="score-value ${scoreTone(assessment.overallScore)}">${assessment.overallScore}<span>/100</span></div>
        <div class="confidence-row">
          <span class="muted">Confidence</span>
          <strong>${confidenceLabel(assessment.overallConfidence)}</strong>
          <span class="muted">${formatPercent(assessment.overallConfidence)}</span>
        </div>
        <div class="meter"><span style="width:${formatPercent(assessment.overallConfidence)}"></span></div>
        <p class="hero-note">Score reflects the quality of the tested surface. Confidence reflects how much of it was covered.</p>
      </div>
      <div class="radar">
        ${renderRadarChart(DIMENSIONS.map((d) => assessment.dimensions[d].score))}
      </div>
    </section>

    <section>
      <h2>Dimension Scores</h2>
      <div class="dimension-grid">
        ${DIMENSIONS.map((d) => renderDimensionCard(assessment.dimensions[d])).join('')}
      </div>
    </section>

    <section>
      <h2>Coverage Summary</h2>
      <div class="coverage-grid card">
        ${coverageItem(coverage.pagesAssessed, 'pages assessed')}
        ${coverageItem(coverage.routesConfigured, 'routes configured')}
        ${coverageItem(coverage.viewports, 'viewports')}
        ${coverageItem(coverage.screenshotsCaptured, 'screenshots')}
        ${coverageItem(coverage.journeysConfigured, 'journeys configured')}
        ${coverageItem(coverage.journeysExecuted, 'journeys executed')}
      </div>
    </section>

    ${renderInsights(assessment)}

    ${renderNextSteps(findings)}

    <section class="findings">
      <div class="section-head">
        <h2>Findings <span class="count">${findings.length}</span></h2>
      </div>
      <div class="filters" role="toolbar" aria-label="Filter findings">
        <div class="filter-group" data-group="dimension">
          ${filterButton('dimension', 'all', 'All', findings.length, true)}
          ${DIMENSIONS.map((d) => filterButton('dimension', d, capitalize(d), findings.filter((f) => f.dimension === d).length)).join('')}
        </div>
        <div class="filter-group" data-group="severity">
          ${filterButton('severity', 'all', 'Any severity', findings.length, true)}
          ${SEVERITIES.filter((s) => findings.some((f) => f.severity === s))
            .map((s) => filterButton('severity', s, capitalize(s), findings.filter((f) => f.severity === s).length))
            .join('')}
        </div>
      </div>
      <div class="findings-list">
        ${findings.length === 0 ? '<p class="empty">No findings detected.</p>' : findings.map((f) => renderFinding(f, outputPath)).join('')}
        <p class="empty filtered-empty" hidden>No findings match the selected filters.</p>
      </div>
    </section>

    <section class="methodology card">
      <h2>Methodology</h2>
      <ul>
        <li><strong>Playwright</strong> — automated navigation, interaction, and viewport simulation.</li>
        <li><strong>Axe Core</strong> — automated WCAG-related accessibility checks.</li>
        <li><strong>DOM &amp; computed-style analysis</strong> — consistency fingerprinting against the dominant pattern.</li>
        <li><strong>Geometry measurements</strong> — responsive overflow, clipping, and overlap detection.</li>
        <li><strong>Gemini</strong> — ${assessment.llmAnalysis ? 'summarizes supplied findings into insights and recommendations. It does not influence scores.' : 'not used for this run.'}</li>
      </ul>
      <p class="disclaimer">Automated testing cannot establish full WCAG compliance. The Automated Accessibility Score reflects automated checks only; manual and assistive-technology testing remain necessary.</p>
    </section>

    <footer class="report-footer">Generated by syy-uime</footer>
  </main>
  <script>${inlineScript}</script>
</body>
</html>`;
}

function metaItem(label: string, value: string): string {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function coverageItem(value: number, label: string): string {
  return `<div class="coverage-item"><span>${value}</span> ${label}</div>`;
}

function filterButton(group: string, value: string, label: string, count: number, active = false): string {
  return `<button type="button" class="filter${active ? ' active' : ''}" data-group="${group}" data-filter="${value}">${label}<span>${count}</span></button>`;
}

function renderDimensionCard(dimension: DimensionAssessment): string {
  const label = dimension.dimension === 'accessible' ? 'Automated accessibility score' : 'Score';
  return `
    <article class="dimension-card card">
      <div class="dimension-top">
        <div class="dimension-name">${capitalize(dimension.dimension)}</div>
        <div class="dimension-score ${scoreTone(dimension.score)}">${dimension.score}</div>
      </div>
      <div class="bar" aria-label="${label} ${dimension.score} of 100"><span class="${scoreTone(dimension.score)}" style="width:${dimension.score}%"></span></div>
      <dl class="dimension-stats">
        <div><dt>Confidence</dt><dd>${confidenceLabel(dimension.confidence)} · ${formatPercent(dimension.confidence)}</dd></div>
        <div><dt>Checks</dt><dd>${dimension.checksRun}</dd></div>
        <div><dt>Failed</dt><dd class="${dimension.checksFailed > 0 ? 'failed' : ''}">${dimension.checksFailed}</dd></div>
      </dl>
      ${dimension.coverageNotes?.length ? `<p class="coverage-note">${escapeHtml(dimension.coverageNotes.join(' · '))}</p>` : ''}
    </article>
  `;
}

function renderFinding(finding: Finding, outputPath: string): string {
  const evidenceTypes = [...new Set(finding.evidence.map((e) => e.type).filter(Boolean))];
  const screenshot = finding.screenshot
    ? `<details class="finding-screenshot"><summary>View screenshot</summary><img src="${escapeHtml(relative(dirname(outputPath), finding.screenshot))}" alt="Evidence screenshot for ${escapeHtml(finding.page)}" loading="lazy"></details>`
    : '';

  return `
    <article class="finding severity-${finding.severity}" data-dimension="${finding.dimension}" data-severity="${finding.severity}">
      <div class="finding-header">
        <span class="badge badge-${finding.severity}">${finding.severity}</span>
        <span class="tag">${capitalize(finding.dimension)}</span>
        <span class="tag mono">${escapeHtml(finding.ruleId)}</span>
        ${finding.page ? `<span class="tag">${escapeHtml(finding.page)}</span>` : ''}
      </div>
      <p class="finding-message">${escapeHtml(finding.message)}</p>
      <div class="finding-meta">
        ${finding.selector ? `<span>Selector <code>${escapeHtml(finding.selector)}</code></span>` : ''}
        ${evidenceTypes.length ? `<span>Evidence ${evidenceTypes.map((t) => `<code>${escapeHtml(t)}</code>`).join(' ')}</span>` : ''}
        <span class="mono muted">${escapeHtml(finding.id)}</span>
      </div>
      ${screenshot}
    </article>
  `;
}

function renderInsights(assessment: Assessment): string {
  const status = assessment.llmStatus;
  if (assessment.llmAnalysis) return renderLlmAnalysis(assessment.llmAnalysis, status?.model);
  if (status?.state === 'failed') {
    return `
      <section class="card notice">
        <h2>Gemini Analysis</h2>
        <p>Gemini analysis was enabled but did not complete${status.model ? ` (model <code>${escapeHtml(status.model)}</code>)` : ''}.</p>
        <p class="muted">${escapeHtml(status.message ?? 'Unknown error')}</p>
      </section>`;
  }
  return '';
}

function renderLlmAnalysis(analysis: LlmAnalysis, model?: string): string {
  const list = (title: string, items: { title: string; description: string }[]) =>
    items.length === 0
      ? ''
      : `<div class="insight-col"><h3>${title}</h3><ul>${items
          .map((i) => `<li><strong>${escapeHtml(i.title)}</strong><p>${escapeHtml(i.description)}</p></li>`)
          .join('')}</ul></div>`;

  return `
    <section class="llm-analysis card">
      <div class="section-head">
        <h2>Gemini Analysis</h2>
        <span class="ai-tag">AI-generated${model ? ` · ${escapeHtml(model)}` : ''}</span>
      </div>
      ${analysis.executiveSummary ? `<p class="executive-summary">${escapeHtml(analysis.executiveSummary)}</p>` : ''}
      <div class="insight-grid">
        ${list('Key Strengths', analysis.strengths)}
        ${list('Key Gaps', analysis.gaps)}
      </div>
      ${analysis.recommendations.length > 0 ? `
        <h3>Priority Recommendations</h3>
        <ol class="recommendations">
          ${analysis.recommendations.map((r) => `
            <li>
              <div class="rec-head">
                <span class="badge badge-${r.priority}">${r.priority}</span>
                <span class="tag">${capitalize(r.dimension)}</span>
                <strong>${escapeHtml(r.title)}</strong>
              </div>
              <p>${escapeHtml(r.description)}</p>
              ${r.findingIds.length ? `<p class="refs">${r.findingIds.map((id) => `<code>${escapeHtml(id)}</code>`).join(' ')}</p>` : ''}
            </li>`).join('')}
        </ol>` : ''}
      ${analysis.patterns.length > 0 ? `
        <h3>Recurring Patterns</h3>
        <ul class="patterns">
          ${analysis.patterns.map((p) => `<li><strong>${escapeHtml(p.title)}</strong><p>${escapeHtml(p.explanation)}</p></li>`).join('')}
        </ul>` : ''}
      <p class="disclaimer">Generated from the deterministic findings above. Root causes are hypotheses; scores are not affected.</p>
    </section>
  `;
}

function renderNextSteps(findings: Finding[]): string {
  const groups = new Map<string, { ruleId: string; dimension: Dimension; severity: Severity; count: number; pages: Set<string>; message: string }>();
  for (const f of findings) {
    if (f.severity === 'info') continue;
    const g = groups.get(f.ruleId);
    if (!g) {
      groups.set(f.ruleId, { ruleId: f.ruleId, dimension: f.dimension, severity: f.severity, count: 1, pages: new Set([f.page]), message: f.message });
      continue;
    }
    g.count++;
    g.pages.add(f.page);
    if (severityRank(f.severity) > severityRank(g.severity)) {
      g.severity = f.severity;
      g.message = f.message;
    }
  }

  const steps = [...groups.values()]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.count - a.count)
    .slice(0, 5);
  if (steps.length === 0) return '';

  return `
    <section>
      <h2>Recommended Next Steps</h2>
      <ol class="next-steps card">
        ${steps.map((s) => `
          <li>
            <span class="badge badge-${s.severity}">${s.severity}</span>
            <div>
              <strong>Resolve <code>${escapeHtml(s.ruleId)}</code></strong>
              <span class="muted"> · ${capitalize(s.dimension)} · ${s.count} finding${s.count === 1 ? '' : 's'} on ${s.pages.size} page${s.pages.size === 1 ? '' : 's'}</span>
              <p>${escapeHtml(s.message)}</p>
            </div>
          </li>`).join('')}
      </ol>
    </section>
  `;
}

export function renderRadarChart(scores: number[]): string {
  const width = 520;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 130;
  const labelOffset = 26;
  const labels = ['Functional', 'Consistent', 'Accessible', 'Responsive'];
  const angle = (i: number) => (i * Math.PI * 2) / labels.length - Math.PI / 2;
  const point = (i: number, r: number) => {
    const a = angle(i);
    return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))] as const;
  };
  const polygon = (r: number) => labels.map((_, i) => point(i, r).join(',')).join(' ');

  const rings = [25, 50, 75, 100]
    .map((v) => `<polygon points="${polygon((v / 100) * radius)}" class="radar-ring" />`)
    .join('');
  const ringLabels = [25, 50, 75, 100]
    .map((v) => `<text x="${cx + 6}" y="${round(cy - (v / 100) * radius) - 4}" class="radar-tick">${v}</text>`)
    .join('');
  const axes = labels
    .map((_, i) => {
      const [x, y] = point(i, radius);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis" />`;
    })
    .join('');

  const clamped = scores.map((s) => Math.max(0, Math.min(100, s)));
  const dataPoints = clamped.map((s, i) => point(i, (s / 100) * radius));

  const labelEls = labels
    .map((label, i) => {
      const [x, y] = point(i, radius + labelOffset);
      const cos = Math.cos(angle(i));
      const sin = Math.sin(angle(i));
      const anchor = Math.abs(cos) < 0.01 ? 'middle' : cos > 0 ? 'start' : 'end';
      // Stack name + score; shift block up for top labels, down for bottom labels.
      const nameY = sin < -0.01 ? y - 18 : sin > 0.01 ? y : y - 8;
      return `<text x="${x}" y="${nameY}" text-anchor="${anchor}" class="radar-label">
        <tspan x="${x}" dy="0">${label}</tspan>
        <tspan x="${x}" dy="18" class="radar-score">${scores[i]}</tspan>
      </text>`;
    })
    .join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="radar-chart" role="img" aria-label="Dimension score radar chart: ${labels
      .map((l, i) => `${l} ${scores[i]}`)
      .join(', ')}">
      <g>${rings}${axes}${ringLabels}</g>
      <polygon points="${dataPoints.map((p) => p.join(',')).join(' ')}" class="radar-area" />
      ${dataPoints.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" class="radar-dot" />`).join('')}
      ${labelEls}
    </svg>
  `;
}

function allFindings(assessment: Assessment): Finding[] {
  return Object.values(assessment.dimensions)
    .flatMap((d) => d.findings)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function scoreTone(score: number): string {
  return score >= 85 ? 'tone-good' : score >= 70 ? 'tone-warn' : 'tone-bad';
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function severityRank(severity: Severity): number {
  return SEVERITIES.length - SEVERITIES.indexOf(severity);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
