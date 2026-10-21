# Scoring

## Dimension Score

Each dimension starts at `100`. Each finding reduces the score by its severity weight:

| Severity | Weight |
|----------|--------|
| blocker  | 10     |
| critical | 7      |
| major    | 4      |
| minor    | 1      |
| info     | 0      |

The score cannot fall below `0`.

## Severity Caps

A single serious failure should not be hidden by many trivial successes:

- Any `blocker` finding caps the dimension score at `60`
- Any `critical` finding caps the dimension score at `75`

## Overall Score

Equal weights for the POC:

```
overall = functional × 0.25 + consistent × 0.25 + accessible × 0.25 + responsive × 0.25
```

## Confidence

Confidence reflects coverage, not quality:

- **Functional**: journeys executed / journeys configured
- **Consistent**: style samples collected / minimum target
- **Accessible**: pages × viewports scanned
- **Responsive**: pages × viewports measured

## Thresholds

Configured thresholds are evaluated against the final scores. The CLI returns exit code `2` when any threshold is missed.
