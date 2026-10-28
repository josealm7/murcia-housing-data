"""Export the validated quarterly housing CSV as a static JSON data file."""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from collections import defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "data/processed/housing_prices_clean.csv"
DEFAULT_OUTPUT = ROOT / "frontend/public/data/housing.json"
EXPECTED_OBSERVATIONS = 126
EXPECTED_FIRST_PERIOD = (1995, 1)
EXPECTED_LAST_PERIOD = (2026, 2)

REQUIRED_COLUMNS = {
    "ano",
    "trimestre",
    "fecha",
    "precio_m2",
    "regimen",
    "comunidad_autonoma",
}
EXPECTED_REGIME = "Libre"
EXPECTED_GEOGRAPHY = "Murcia, Region de"

SOURCE_METADATA = {
    "name": "Valor tasado de la vivienda",
    "publisher": "Ministerio de Vivienda y Agenda Urbana",
    "datasetUrl": "https://datos.gob.es/es/catalogo/e05233601-valor-tasado-de-la-vivienda",
    "rawCsvUrl": "https://cdn.mivau.gob.es/portal-web-mivau/Datos_MIVAU/CSV/VDP006_01.csv",
    "geography": EXPECTED_GEOGRAPHY,
    "regime": EXPECTED_REGIME,
    "unit": "EUR/m²",
    "frequency": "quarterly",
}


class ExportValidationError(ValueError):
    """Raised when the input CSV cannot safely be represented in the export."""


def _read_csv(path: Path) -> list[dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            if reader.fieldnames is None:
                raise ExportValidationError(f"CSV has no header row: {path}")

            duplicate_headers = sorted(
                name for name in set(reader.fieldnames) if reader.fieldnames.count(name) > 1
            )
            if duplicate_headers:
                raise ExportValidationError(
                    "CSV contains duplicate column names: " + ", ".join(duplicate_headers)
                )

            missing_columns = sorted(REQUIRED_COLUMNS - set(reader.fieldnames))
            if missing_columns:
                raise ExportValidationError(
                    "CSV is missing required columns: " + ", ".join(missing_columns)
                )

            rows = []
            for line_number, row in enumerate(reader, start=2):
                if None in row:
                    raise ExportValidationError(
                        f"CSV row {line_number} has more values than the header."
                    )
                rows.append(row)
    except OSError as error:
        raise ExportValidationError(f"Could not read input CSV '{path}': {error}") from error
    except csv.Error as error:
        raise ExportValidationError(f"Could not parse input CSV '{path}': {error}") from error

    if len(rows) != EXPECTED_OBSERVATIONS:
        raise ExportValidationError(
            f"Expected {EXPECTED_OBSERVATIONS} observations, found {len(rows)}. "
            "Review the source snapshot and update the expected period/count intentionally "
            "before exporting a different dataset."
        )
    return rows


def _parse_integer(value: str, field: str, line_number: int) -> int:
    try:
        if not value or str(int(value)) != value.strip():
            raise ValueError
        return int(value)
    except (TypeError, ValueError):
        raise ExportValidationError(
            f"CSV row {line_number}: '{field}' must be a whole number; received {value!r}."
        ) from None


def _parse_price(value: str, line_number: int) -> Decimal:
    try:
        price = Decimal(value)
    except (InvalidOperation, TypeError):
        raise ExportValidationError(
            f"CSV row {line_number}: 'precio_m2' must be numeric; received {value!r}."
        ) from None
    if not price.is_finite() or price <= 0:
        raise ExportValidationError(
            f"CSV row {line_number}: 'precio_m2' must be a finite positive number; "
            f"received {value!r}."
        )
    json_number = float(price)
    if not math.isfinite(json_number) or json_number <= 0:
        raise ExportValidationError(
            f"CSV row {line_number}: 'precio_m2' cannot be represented as a finite "
            f"JSON number; received {value!r}."
        )
    return price


def build_payload(rows: list[dict[str, str]]) -> dict[str, Any]:
    observations = []
    periods = []
    seen_dates: set[date] = set()
    seen_periods: set[tuple[int, int]] = set()
    annual_prices: dict[int, list[Decimal]] = defaultdict(list)

    for line_number, row in enumerate(rows, start=2):
        for column in REQUIRED_COLUMNS:
            value = row.get(column)
            if value is None or not value.strip():
                raise ExportValidationError(
                    f"CSV row {line_number}: required field '{column}' is empty."
                )

        year = _parse_integer(row["ano"], "ano", line_number)
        quarter = _parse_integer(row["trimestre"], "trimestre", line_number)
        if quarter not in (1, 2, 3, 4):
            raise ExportValidationError(
                f"CSV row {line_number}: 'trimestre' must be between 1 and 4; "
                f"received {quarter}."
            )

        try:
            observation_date = date.fromisoformat(row["fecha"])
        except ValueError:
            raise ExportValidationError(
                f"CSV row {line_number}: 'fecha' must use ISO YYYY-MM-DD; "
                f"received {row['fecha']!r}."
            ) from None
        if observation_date.isoformat() != row["fecha"]:
            raise ExportValidationError(
                f"CSV row {line_number}: 'fecha' must use canonical ISO YYYY-MM-DD; "
                f"received {row['fecha']!r}."
            )
        expected_month = (quarter - 1) * 3 + 1
        if (observation_date.year, observation_date.month, observation_date.day) != (
            year,
            expected_month,
            1,
        ):
            raise ExportValidationError(
                f"CSV row {line_number}: fecha {row['fecha']} does not match "
                f"{year} Q{quarter} (expected the quarter's first day)."
            )

        period = (year, quarter)
        if observation_date in seen_dates:
            raise ExportValidationError(
                f"CSV row {line_number}: duplicate observation date {row['fecha']}."
            )
        if period in seen_periods:
            raise ExportValidationError(
                f"CSV row {line_number}: duplicate temporal period {year} Q{quarter}."
            )
        seen_dates.add(observation_date)
        seen_periods.add(period)
        periods.append(period)

        if row["regimen"] != EXPECTED_REGIME:
            raise ExportValidationError(
                f"CSV row {line_number}: expected regimen '{EXPECTED_REGIME}', "
                f"received {row['regimen']!r}."
            )
        if row["comunidad_autonoma"] != EXPECTED_GEOGRAPHY:
            raise ExportValidationError(
                f"CSV row {line_number}: expected geography '{EXPECTED_GEOGRAPHY}', "
                f"received {row['comunidad_autonoma']!r}."
            )

        price = _parse_price(row["precio_m2"], line_number)
        annual_prices[year].append(price)
        observations.append(
            {
                "date": observation_date.isoformat(),
                "year": year,
                "quarter": quarter,
                "pricePerSqm": float(price),
            }
        )

    if not periods:
        raise ExportValidationError("CSV has no observations to export.")
    if periods != sorted(periods):
        raise ExportValidationError("CSV observations are not in chronological order.")

    expected_periods = []
    year, quarter = EXPECTED_FIRST_PERIOD
    while (year, quarter) <= EXPECTED_LAST_PERIOD:
        expected_periods.append((year, quarter))
        if quarter == 4:
            year += 1
            quarter = 1
        else:
            quarter += 1
    if periods != expected_periods:
        raise ExportValidationError(
            "CSV periods must be continuous from 1995 Q1 through 2026 Q2; "
            "found a gap, unexpected period, or changed date range."
        )

    annual_averages = []
    for year, prices in sorted(annual_prices.items()):
        observed_quarters = len(prices)
        average = (sum(prices) / observed_quarters).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        annual_averages.append(
            {
                "year": year,
                "averagePricePerSqm": float(average),
                "observedQuarters": observed_quarters,
                "isPartial": observed_quarters < 4,
            }
        )

    latest = observations[-1]
    return {
        "schemaVersion": 1,
        "source": {
            **SOURCE_METADATA,
            "observationCount": len(observations),
            "latestPeriod": f"{latest['year']}-Q{latest['quarter']}",
        },
        "observations": observations,
        "annualAverages": annual_averages,
    }


def export(input_path: Path, output_path: Path) -> dict[str, Any]:
    rows = _read_csv(input_path)
    payload = build_payload(rows)
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    except OSError as error:
        raise ExportValidationError(f"Could not write JSON file '{output_path}': {error}") from error
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export quarterly Murcia housing prices to static JSON."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Input cleaned CSV")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output JSON file")
    args = parser.parse_args()

    try:
        payload = export(args.input, args.output)
    except ExportValidationError as error:
        print(f"Export failed: {error}", file=sys.stderr)
        return 1

    print(
        f"Exported {payload['source']['observationCount']} observations and "
        f"{len(payload['annualAverages'])} annual averages to {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
