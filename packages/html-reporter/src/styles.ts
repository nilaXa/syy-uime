export const inlineStyles = `
:root {
  --bg: #fafafa;
  --surface: #ffffff;
  --text: #18181b;
  --text-muted: #71717a;
  --text-faint: #a1a1aa;
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.12);
  --good: #16a34a;
  --warn: #d97706;
  --bad: #dc2626;
  --sev-blocker: #b91c1c;
  --sev-critical: #dc2626;
  --sev-major: #d97706;
  --sev-minor: #2563eb;
  --sev-info: #71717a;
  --radius: 10px;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
  font-size: 15px;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

code {
  font-family: var(--mono);
  font-size: 0.82em;
  background: #f4f4f5;
  border: 1px solid var(--border);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  word-break: break-all;
}

.mono { font-family: var(--mono); font-size: 0.8em; }
.muted { color: var(--text-muted); }

.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

section { margin-bottom: 2.5rem; }

h2 {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 1rem;
}

h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.count {
  display: inline-block;
  margin-left: 0.35rem;
  color: var(--text);
  font-weight: 600;
}

/* Header */
.report-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border);
}

.brand {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--accent);
  letter-spacing: 0.04em;
}

h1 {
  margin: 0.25rem 0 0;
  font-size: 2rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem 2rem;
  margin: 0;
}

.meta dt, .dimension-stats dt {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

.meta dd, .dimension-stats dd {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.meta dd code { background: none; border: 0; padding: 0; font-size: 0.85rem; }

/* Hero */
.hero {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(320px, 1.4fr);
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}

.eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}

.score-value {
  font-size: 5rem;
  font-weight: 650;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0.75rem 0 1.25rem;
}

.score-value span {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-faint);
  letter-spacing: 0;
  margin-left: 0.25rem;
}

.confidence-row {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.9rem;
}

.meter, .bar {
  height: 6px;
  background: #f4f4f5;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.meter span, .bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
}

.hero-note {
  margin: 1.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  max-width: 34ch;
}

.tone-good { color: var(--good); }
.tone-warn { color: var(--warn); }
.tone-bad { color: var(--bad); }
.bar span.tone-good { background: var(--good); }
.bar span.tone-warn { background: var(--warn); }
.bar span.tone-bad { background: var(--bad); }

/* Radar */
.radar { display: flex; justify-content: center; }
.radar-chart { width: 100%; max-width: 520px; height: auto; overflow: visible; }
.radar-ring { fill: none; stroke: var(--border-strong); stroke-width: 1; }
.radar-axis { stroke: var(--text-faint); stroke-width: 1; }
.radar-tick { font-size: 10px; fill: var(--text-muted); }
.radar-area { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; }
.radar-dot { fill: var(--surface); stroke: var(--accent); stroke-width: 2; }
.radar-label { font-size: 14px; font-weight: 500; fill: var(--text); }
.radar-score { font-size: 13px; font-weight: 600; fill: var(--accent); }

/* Dimensions */
.dimension-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.dimension-card { padding: 1.25rem; }

.dimension-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.dimension-name { font-weight: 600; }

.dimension-score {
  font-size: 2rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.dimension-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
  margin: 1rem 0 0;
}

.dimension-stats > div:first-child { grid-column: 1 / -1; }

.failed { color: var(--bad); font-weight: 600; }

.coverage-note {
  margin: 0.85rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Coverage */
.coverage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.coverage-item {
  padding: 1.25rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  border-right: 1px solid var(--border);
}

.coverage-item:last-child { border-right: 0; }

.coverage-item span {
  display: block;
  font-size: 1.6rem;
  font-weight: 650;
  color: var(--text);
  letter-spacing: -0.02em;
}

/* Insights */
.llm-analysis, .notice { padding: 1.75rem; }

.ai-tag {
  font-size: 0.75rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
}

.executive-summary {
  font-size: 1.05rem;
  line-height: 1.65;
  margin: 0;
  max-width: 75ch;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0 2rem;
}

.insight-col ul, .patterns {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insight-col li, .patterns li, .recommendations li {
  padding: 0.75rem 0;
  border-top: 1px solid var(--border);
}

.insight-col p, .patterns p, .recommendations p {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.recommendations {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rec-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.refs code { font-size: 0.72rem; }

.disclaimer {
  margin: 1.5rem 0 0;
  font-size: 0.8rem;
  color: var(--text-faint);
}

.notice p { margin: 0.25rem 0; }

/* Next steps */
.next-steps {
  list-style: none;
  margin: 0;
  padding: 0;
}

.next-steps li {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 1rem;
  align-items: start;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
}

.next-steps li:first-child { border-top: 0; }
.next-steps p { margin: 0.25rem 0 0; color: var(--text-muted); font-size: 0.88rem; }
.next-steps .badge { justify-self: start; margin-top: 0.15rem; }

/* Badges & tags */
.badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: 1px solid currentColor;
  background: transparent;
}

.badge-blocker { color: var(--sev-blocker); }
.badge-critical { color: var(--sev-critical); }
.badge-major { color: var(--sev-major); }
.badge-minor { color: var(--sev-minor); }
.badge-info { color: var(--sev-info); }

.tag {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.tag + .tag::before {
  content: "·";
  margin-right: 0.5rem;
  color: var(--text-faint);
}

/* Filters */
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filter {
  font: inherit;
  font-size: 0.82rem;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.filter span {
  margin-left: 0.4rem;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.filter:hover { border-color: var(--border-strong); }

.filter.active {
  background: var(--text);
  border-color: var(--text);
  color: var(--surface);
}

.filter.active span { color: var(--text-faint); }

/* Findings */
.findings-list {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.finding {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
  border-left: 3px solid transparent;
}

.finding:first-child { border-top: 0; }
.finding.severity-blocker { border-left-color: var(--sev-blocker); }
.finding.severity-critical { border-left-color: var(--sev-critical); }
.finding.severity-major { border-left-color: var(--sev-major); }
.finding.severity-minor { border-left-color: var(--sev-minor); }
.finding.severity-info { border-left-color: var(--border-strong); }

.finding-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.finding-header .badge { margin-right: 0.25rem; }

.finding-message {
  margin: 0.5rem 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.finding-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.finding-screenshot { margin-top: 0.75rem; }

.finding-screenshot summary {
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--accent);
  user-select: none;
}

.finding-screenshot img {
  display: block;
  max-width: 100%;
  margin-top: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.empty {
  padding: 1.5rem 1.25rem;
  margin: 0;
  color: var(--text-muted);
}

/* Methodology */
.methodology { padding: 1.75rem; }
.methodology ul { margin: 0; padding-left: 1.1rem; }
.methodology li { margin: 0.35rem 0; color: var(--text-muted); }
.methodology li strong { color: var(--text); font-weight: 600; }

.report-footer {
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-faint);
}

@media (max-width: 760px) {
  .container { padding: 2rem 1rem 3rem; }
  .hero { grid-template-columns: 1fr; padding: 1.5rem; }
  .score-value { font-size: 4rem; }
  .coverage-item { border-right: 0; border-bottom: 1px solid var(--border); }
  .next-steps li { grid-template-columns: 1fr; gap: 0.5rem; }
}

@media print {
  body { background: #fff; }
  .filters { display: none; }
  .finding-screenshot[open] img { max-height: 400px; }
}
`;
