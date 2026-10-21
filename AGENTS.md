# syy-uime Agent Notes

## Build and test commands

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Running an assessment

Start the demo fixture, then run:

```bash
pnpm syy-uime assess --config syy-uime.config.example.yml --no-llm
```

The demo app contains intentional defects, so the CLI exits with code `2` (threshold failure).

## Architecture notes

- Packages live under `packages/` and are built with `tsc`.
- The fixture is under `fixtures/demo-app` and uses Vite.
- Tests use Vitest with a package-level `vitest.config.ts`.
- The canonical assessment format is in `assessment.json`.
- `schemas/` contains static JSON Schema files for the assessment and config formats.

## Adding a rule

1. Create a rule under `packages/rules/src/<dimension>/`.
2. Implement the `Rule` interface from `@syy-uime/core`.
3. Register the rule in `packages/rules/src/registry.ts`.
4. Add a unit test in the same folder.

## Common gotchas

- Playwright browsers must be installed separately via the adapter package.
- The CLI resolves config/output paths relative to `INIT_CWD` when invoked through pnpm scripts.
- Gemini is optional and disabled with `--no-llm` or `llm.enabled: false`.
