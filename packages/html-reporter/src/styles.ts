export const inlineStyles = `
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --primary: #3b82f6;
  --primary-light: #eff6ff;
  --severity-blocker: #dc2626;
  --severity-critical: #ea580c;
  --severity-major: #d97706;
  --severity-minor: #2563eb;
  --severity-info: #64748b;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.report-header {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.brand {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 {
  margin: 0.25rem 0 1rem;
  font-size: 1.75rem;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.overall {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 2fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.score-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.score-value {
  font-size: 4rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.score-label {
  font-size: 1rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.confidence {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.radar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.radar-chart {
  max-width: 280px;
  width: 100%;
}

.radar-label {
  font-size: 10px;
  fill: var(--text-muted);
}

section {
  margin-bottom: 1.5rem;
}

section h2 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.dimension-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
}

.dimension-score {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
}

.dimension-name {
  font-weight: 600;
}

.dimension-confidence {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.dimension-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.failed {
  color: var(--severity-critical);
}

.coverage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.coverage-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.coverage-item span {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.filter.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.findings-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.finding {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--severity-info);
  border-radius: 8px;
  padding: 1rem;
}

.finding.severity-blocker { border-left-color: var(--severity-blocker); }
.finding.severity-critical { border-left-color: var(--severity-critical); }
.finding.severity-major { border-left-color: var(--severity-major); }
.finding.severity-minor { border-left-color: var(--severity-minor); }
.finding.severity-info { border-left-color: var(--severity-info); }

.finding-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.severity {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  color: white;
}

.severity-blocker { background: var(--severity-blocker); }
.severity-critical { background: var(--severity-critical); }
.severity-major { background: var(--severity-major); }
.severity-minor { background: var(--severity-minor); }
.severity-info { background: var(--severity-info); }

.dimension, .rule {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.finding-body p {
  margin: 0.25rem 0;
}

.selector code {
  background: var(--bg);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.finding-screenshot img {
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.llm-analysis {
  background: var(--primary-light);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
}

.recommendations ol, .patterns ul {
  padding-left: 1.25rem;
}

.rec-priority {
  margin-right: 0.5rem;
}

.methodology {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
}

.methodology ul {
  padding-left: 1.25rem;
}

.no-findings {
  color: var(--text-muted);
  font-style: italic;
}

@media (max-width: 640px) {
  .overall {
    grid-template-columns: 1fr;
  }
}
`;
