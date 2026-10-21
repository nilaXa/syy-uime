# syy-uime

**UI Maturity Assessment Engine**

`syy-uime` is a CLI-first, deterministic engine for assessing web application UI quality across foundational characteristics:

- **Functional** — journey execution, runtime errors, network failures, navigation
- **Consistent** — computed-style fingerprinting and outlier detection
- **Accessible** — Axe Core scans, keyboard focus, semantic structure
- **Responsive** — viewport overflow, clipping, and overlap detection

> **Machines measure. Rules evaluate. The LLM explains.**

The engine collects browser-based evidence with Playwright, evaluates it with deterministic rules, and produces a canonical `assessment.json`. An optional Gemini module summarizes findings into actionable recommendations. The static HTML report visualizes scores, confidence, findings, and recommendations.

---

## Architecture

```
Target Web App
      │
      ▼
Playwright Runner
      │
      ▼
Evidence Collectors
      │
      ├── DOM
      ├── computed styles
      ├── screenshots
      ├── accessibility (Axe)
      ├── element geometry
      ├── browser console
      └── network/runtime errors
      │
      ▼
Rule Engine
      │
      ├── Functional
      ├── Consistent
      ├── Accessible
      └── Responsive
      │
      ▼
Scoring Engine
      │
      ▼
assessment.json
      │
      ├──────────────► Gemini Analyzer
      │                    │
      │                    ▼
      │              AI recommendations
      │
      ▼
Static HTML Report
```

The core engine is independent from CI/CD, dashboards, and Gemini. Those are consumers of the canonical `assessment.json`.

---

## Installation

This project uses `pnpm` workspaces and Turbo. Ensure you have `pnpm` installed.

```bash
git clone <repo>
cd syy-uime
pnpm install

# Install Playwright browsers
pnpm --filter @syy-uime/playwright-adapter exec playwright install chromium
```

With [corepack](https://nodejs.org/api/corepack.html) enabled, `npm install` will be intercepted and use the `packageManager` version of `pnpm` declared in `package.json`.


---

## Quick Start

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Start the demo fixture app:

   ```bash
   pnpm --filter fixture-demo-app preview
   ```

3. In another terminal, run an assessment:

   ```bash
   pnpm syy-uime assess --config syy-uime.config.example.yml --no-llm
   ```

   The demo app intentionally contains defects, so the CLI exits with code `2` (quality threshold failure). This is expected.

4. Open the generated report:

   ```bash
   open .syy-uime/runs/<run-id>/report.html
   ```

---

## Configuration

Create a `syy-uime.config.yml` file. See `syy-uime.config.example.yml` for a full example:

```yaml
project:
  name: Order Management

target:
  baseUrl: http://localhost:5173

routes:
  - /
  - /orders
  - /products
  - /customers

viewports:
  - name: mobile
    width: 375
    height: 812
  - name: tablet
    width: 768
    height: 1024
  - name: desktop
    width: 1440
    height: 900

dimensions:
  functional: true
  consistent: true
  accessible: true
  responsive: true

thresholds:
  overall: 75
  functional: 80
  consistent: 75
  accessible: 80
  responsive: 75

journeys:
  - name: Search products
    start: /products
    steps:
      - action: fill
        selector: "[data-testid='search']"
        value: chicken
      - action: click
        selector: "[data-testid='search-button']"
      - action: assert-visible
        selector: "[data-testid='results']"

llm:
  enabled: false
```

### Supported journey actions

- `fill` — fill an input (`selector`, `value`)
- `click` — click an element (`selector`)
- `assert-visible` — wait for an element to be visible (`selector`)
- `assert-text` — assert element text contains value (`selector`, `text`)
- `press` — press a key (`key`)
- `select` — select an option (`selector`, `value`)
- `hover` — hover over an element (`selector`)
- `navigate` — navigate to a URL (`value`)

### Authentication

Provide a Playwright storage state file:

```yaml
authentication:
  storageState: .auth/user.json
```

Generate it with `npx playwright codegen --save-storage=.auth/user.json <url>`.

---

## CLI Commands

```bash
# Run an assessment
syy-uime assess --config syy-uime.config.yml

# Override options
syy-uime assess --config syy-uime.config.yml --url http://localhost:3000 --output ./out --no-llm --dimension functional

# Validate configuration without running
syy-uime validate-config syy-uime.config.yml

# Generate HTML report from existing assessment.json
syy-uime report .syy-uime/runs/<run-id>/assessment.json --output report.html
```

### Exit codes

- `0` — assessment completed and all thresholds satisfied
- `1` — technical/runtime failure
- `2` — quality threshold failure

---

## Implemented Assessment Rules

### Functional

- `runtime-errors` — JavaScript `pageerror` / `console.error`
- `network-failures` — same-origin failed requests
- `broken-navigation` — 4xx/5xx responses and error page titles
- `journey-execution` — configured Playwright journeys
- `form-behavior` — informational check for forms without configured journeys

### Consistent

- `button-style-variation` — outlier buttons based on height, radius, font, padding
- `form-control-variation` — outlier inputs/selects/textareas
- `typography-variation` — inconsistent heading font properties
- `spacing-variation` — inconsistent card padding/margin/gap

### Accessible

- `axe-violations` — Axe Core WCAG-related findings
- `keyboard-focus` — basic Tab navigation reachability
- `semantic-structure` — heading and landmark presence

### Responsive

- `document-overflow` — horizontal document overflow
- `element-overflow` — elements extending beyond the viewport
- `element-overlap` — suspicious non-nested element overlap

---

## Scoring Methodology

Each dimension starts at `100` and loses weighted points per finding:

| Severity | Weight |
|----------|--------|
| blocker  | 10     |
| critical | 7      |
| major    | 4      |
| minor    | 1      |
| info     | 0      |

Score caps prevent trivial successes from hiding serious failures:

- A `blocker` finding caps the dimension score at `60`
- A `critical` finding caps the dimension score at `75`

The **overall score** is the equal weighted average of the four dimensions:

```
overall = functional × 0.25 + consistent × 0.25 + accessible × 0.25 + responsive × 0.25
```

---

## Confidence Methodology

Confidence measures **coverage**, not quality. It is separate from the score.

- **Functional** — ratio of successfully executed journeys to configured journeys
- **Consistent** — number of style samples collected vs. a minimum target
- **Accessible** — pages × viewports scanned by Axe
- **Responsive** — pages × viewports measured

Overall confidence is the average of the four dimension confidences.

---

## Gemini Integration

Set `GEMINI_API_KEY` in `.env` and enable in config:

```yaml
llm:
  enabled: true
```

Optionally override the model:

```bash
GEMINI_MODEL=gemini-2.5-pro
```

Gemini receives the structured `assessment.json` and produces:

- Executive summary
- Key strengths and gaps
- Priority recommendations
- Recurring patterns

The LLM does not influence scoring. It is only invoked after scores are calculated.

---

## Generated Artifacts

```
.syy-uime/runs/<run-id>/
├── assessment.json
├── report.html
├── screenshots/
├── evidence/
└── logs/
```

---

## Testing

```bash
# Unit/integration tests
pnpm test

# Run against the demo fixture
pnpm --filter fixture-demo-app preview &
pnpm syy-uime assess --config syy-uime.config.example.yml --no-llm
```

Tests run without a Gemini API key.

---

## Current POC Limitations

- Consistency baseline is inferred from the dominant pattern, not a design-system baseline.
- Keyboard testing is basic; it does not fully validate modal focus traps or focus visibility.
- Network failure filtering uses a simple same-origin/third-party heuristic.
- Automated accessibility testing does **not** prove full WCAG compliance.

---

## Automated Accessibility Disclaimer

`syy-uime` uses automated tools to detect many WCAG-related issues. However, automated testing cannot establish complete WCAG 2.2 AA conformance. Manual testing, assistive-technology testing, and expert review are still required.

---

## How to Add a Rule

1. Create a new file in `packages/rules/src/<dimension>/my-rule.ts`.
2. Implement the `Rule` interface from `@syy-uime/core`.
3. Register it in `packages/rules/src/registry.ts`.
4. Add unit tests in `packages/rules/src/<dimension>/my-rule.test.ts`.

Example:

```ts
import type { Rule, RuleContext, RuleResult } from '@syy-uime/core';
import { createFinding } from '../finding.js';

export const myRule: Rule = {
  id: 'my-rule',
  dimension: 'functional',
  requiredEvidence: ['dom'],
  execute(context: RuleContext): RuleResult {
    const findings = [];
    // evaluate evidence
    return { findings, checksRun: 1, checksPassed: 1, checksFailed: 0 };
  },
};
```

---

## Future Architecture

Future phases may add evidence providers for:

- Source code analysis
- Storybook
- Figma
- GitHub / CI metadata
- Performance / observability
- Multi-tenant configuration

Each provider will implement the `EvidenceProvider` interface and declare the evidence types it produces.

---

## License

MIT
