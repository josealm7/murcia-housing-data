# Static housing data JSON

The generated file is `frontend/public/data/housing.json`. Generate it from
`data/processed/housing_prices_clean.csv` with:

```bash
python src/exporting/export_housing_json.py
```

The exporter uses only the Python standard library. It intentionally accepts
the current 126-observation snapshot (1995 Q1 through 2026 Q2); a changed count,
period range, or discontinuity fails with an actionable message so a source
refresh cannot silently change the published dataset.

## Top-level schema

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | integer | JSON contract version; currently `1`. |
| `source` | object | Source attribution, geography, regime, unit, frequency, observation count, and latest period. |
| `observations` | array | Chronological quarterly observations from the cleaned CSV. |
| `annualAverages` | array | Annual arithmetic mean of observed quarterly prices, rounded to two decimal places. |

Each observation has `date` (ISO `YYYY-MM-DD` quarter start), `year`, `quarter`,
and `pricePerSqm`. `pricePerSqm` is the CSV's `precio_m2`, which preserves the
source `Valor`; the exporter does not adjust it.

Each annual average has `year`, `averagePricePerSqm`, `observedQuarters`, and
`isPartial`. `isPartial` is true when fewer than four distinct quarters are
present. The current 2026 entry therefore represents the observed first two
quarters, not a full-year average.

The export deliberately does not contain quarterly variation or price
categories. Their original calculation and thresholds have not been verified.

## Validation

Before writing output, the exporter checks required columns and values, ISO date
format and quarter/date consistency, numeric finite positive prices, the
expected geography and regime, duplicate dates and periods, chronological
ordering, period continuity, and the expected observation count and range.
