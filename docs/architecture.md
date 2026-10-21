# Architecture

`syy-uime` is designed as a package-first, CLI-first assessment engine. The core engine is independent of CI/CD, dashboards, and LLMs.

## Packages

- `@syy-uime/core` — shared types, evidence model, utilities
- `@syy-uime/playwright-adapter` — browser runner and evidence collectors
- `@syy-uime/rules` — rule engine and dimension-specific rules
- `@syy-uime/scoring` — score, confidence, and threshold evaluation
- `@syy-uime/gemini-reporter` — optional LLM summarization
- `@syy-uime/html-reporter` — static HTML report generator
- `@syy-uime/cli` — command-line interface

## Evidence Flow

1. `PlaywrightRunner` navigates each configured route at each viewport.
2. Collectors gather evidence (DOM, styles, geometry, Axe, console, network, keyboard, screenshots).
3. `RuleEngine` runs only rules whose required evidence types are present.
4. Rules produce `Finding` objects linked to evidence.
5. `ScoreCalculator` and `ConfidenceCalculator` produce dimension scores.
6. `Assessment` JSON is written and consumed by Gemini and HTML reporters.

## Extensibility

Future evidence providers can implement:

```ts
interface EvidenceProvider {
  id: string;
  collect(context: AssessmentContext): Promise<EvidenceCollection>;
}
```

Rules declare required evidence types, so new providers integrate without changing the rule engine.
