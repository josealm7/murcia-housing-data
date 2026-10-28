"""Verify that the generated static JSON exactly matches the cleaned CSV."""

from pathlib import Path
import sys

# Support both ``python -m src.validation.validate_housing_export`` and direct
# execution as ``python src/validation/validate_housing_export.py``.
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json

from src.exporting.export_housing_json import (
    DEFAULT_INPUT,
    DEFAULT_OUTPUT,
    _read_csv,
    build_payload,
)


def main() -> int:
    expected = build_payload(_read_csv(DEFAULT_INPUT))
    try:
        actual = json.loads(DEFAULT_OUTPUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"JSON verification failed: {error}")
        return 1

    if actual != expected:
        print("JSON verification failed: housing.json does not match the processed CSV.")
        return 1

    print(
        "JSON verification passed: "
        f"{expected['source']['observationCount']} observations and "
        f"{len(expected['annualAverages'])} annual averages match the processed CSV."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
