"""Run existing pipeline modules in sequence without duplicating their logic."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
STAGES = {
    "ingest": "src.ingestion.fetch_housing_data",
    "transform": "src.transformation.clean_housing_data",
    "validate": "src.validation.validate_housing_data",
    "load": "src.loading.load_housing_data",
    "export": "src.exporting.export_housing_json",
    "db-check": "src.loading.test_postgres_connection",
    "export-check": "src.validation.validate_housing_export",
}
SEQUENCES = {
    "all": ("ingest", "transform", "validate", "load", "export"),
    "process": ("transform", "validate", "load", "export"),
}


def run_stage(stage: str) -> None:
    module = STAGES[stage]
    print(f"\n=== {stage} ===", flush=True)
    subprocess.run([sys.executable, "-m", module], cwd=ROOT, check=True)


def main() -> int:
    choices = (*SEQUENCES, *STAGES)
    parser = argparse.ArgumentParser(
        description="Run one pipeline stage or the complete pipeline."
    )
    parser.add_argument("stage", choices=choices, nargs="?", default="all")
    args = parser.parse_args()

    stages = SEQUENCES.get(args.stage, (args.stage,))
    try:
        for stage in stages:
            run_stage(stage)
    except subprocess.CalledProcessError as error:
        print(f"Pipeline stopped: stage exited with status {error.returncode}.", file=sys.stderr)
        return error.returncode or 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
