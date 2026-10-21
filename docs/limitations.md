# POC Limitations

`syy-uime` is a proof-of-concept focused on four foundational UI characteristics.

## Scope Boundaries

- No central web dashboard
- No historical trend database
- No Figma, GitHub, Storybook, or CI integrations
- No multi-tenant analysis
- No source-code or design-token analysis
- No performance/resilience/observability dimensions

## Known Constraints

- **Consistency baseline** is inferred from the dominant pattern. Future phases will accept design-system and token baselines.
- **Keyboard testing** covers basic Tab reachability, not full modal focus containment or focus visibility styling.
- **Network filtering** uses a simple same-origin/third-party heuristic. Some application failures may be missed; some third-party noise may be reported.
- **Automated accessibility** does not prove full WCAG 2.2 AA compliance. Manual and assistive-technology testing remain necessary.
- **Responsive overlap** detection may still produce false positives on intentionally overlapping UI (badges, overlays, modals).

## Recommended Phase 2 Work

1. Design-system baseline provider with token validation.
2. Source-code and Storybook evidence providers.
3. Performance, resilience, and observability dimension.
4. Historical runs and dashboard integration.
5. Governance/review dimension and multi-tenant readiness checks.
