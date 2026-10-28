# Murcia Housing Data

Small end-to-end data engineering and analytics portfolio project using official
quarterly housing valuation data for the Region of Murcia, Spain. It filters the
source to free-market housing (`Libre`), validates the resulting series, loads it
into PostgreSQL, and exports a static JSON dataset consumed by a React dashboard.

The current checked dataset has 126 observations from 1995 Q1 through 2026 Q2.
The 2026 annual average uses only Q1 and Q2 and is marked as partial.

## Data source and attribution

The source is **Valor tasado de la vivienda**, published by the Ministerio de
Vivienda y Agenda Urbana:

- [Dataset record at datos.gob.es](https://datos.gob.es/es/catalogo/e05233601-valor-tasado-de-la-vivienda)
- [Official CSV](https://cdn.mivau.gob.es/portal-web-mivau/Datos_MIVAU/CSV/VDP006_01.csv)

The selected geography is `Murcia, Region de`, regime `Libre`, and the price
unit is EUR/m². The repository does not contain the full raw or processed CSV;
the pipeline downloads the raw data when ingestion is run.

## Data flow and architecture

```text
MIVAU CSV → pandas ingestion/transform → quality validation → PostgreSQL
                                                   └────────→ static JSON → React/Vite dashboard
```

Python and pandas handle ingestion, filtering and CSV validation. PostgreSQL
stores one row per year and quarter. The loader upserts on `(ano, trimestre)`
so repeat runs update matching periods without truncating existing data. The
exporter creates `frontend/public/data/housing.json`, including the quarterly
observations and annual averages. The frontend reads that file; it does not
recalculate the annual averages or connect to the database.

The dashboard is a local React, TypeScript, Vite and Recharts application. This
repository does not configure or claim a live deployment.

## Requirements

- Docker Engine or Docker Desktop with Docker Compose
- Node.js and npm for local frontend development
- Python 3.12 and the dependencies in `requirements-pipeline.txt` for local ETL

## Run the pipeline with Docker Compose

Create local settings without overwriting any existing `.env`:

```bash
test -f .env || cp .env.example .env
```

Edit `.env` and replace the password placeholder with a local value. `.env` is
ignored by Git. If the host user's numeric ID is not 1000, set `LOCAL_UID` and
`LOCAL_GID` in `.env` so the pipeline container can write its bind-mounted
outputs. Then run:

```bash
docker compose config
docker compose build pipeline
docker compose up -d db
docker compose run --rm pipeline all
```

The `all` stage downloads the source and then transforms, validates, loads, and
exports it. After the raw CSV has been downloaded, `process` reruns the later
stages without fetching it again:

```bash
docker compose run --rm pipeline process
docker compose run --rm pipeline db-check
docker compose run --rm pipeline export-check
```

PostgreSQL has no host-published port. Services use the private Compose network,
and the named `postgres_data` volume preserves database files across container
restarts and `docker compose down`. To stop services while retaining data, use
`docker compose stop`; start the database again with `docker compose up -d db`.
Do not use `docker compose down -v`, which deletes the persistent volume.
PostgreSQL's initialization SQL runs only when the volume is first created.

## Run locally

Install the pipeline dependencies in a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements-pipeline.txt
```

For local ETL, configure `.env` with `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
and `DB_PASSWORD`. The Compose configuration maps its `POSTGRES_*` settings to
the `DB_*` names expected by the loader. Run individual stages from the project
root, for example:

```bash
python -m src.pipeline.runner all
python -m src.pipeline.runner process
```

Start the dashboard from `frontend/`:

```bash
npm ci
npm run dev
```

Open <http://localhost:5173/murcia-housing-data/>. The Vite base path is set for
the repository's GitHub Pages project path. To build production assets, run
`npm run build` from `frontend/`.

## Validation

Run the automated Python tests and data/export checks from the repository root:

```bash
python -m unittest discover -s tests -v
python -m src.validation.validate_housing_data
python -m src.validation.validate_housing_export
```

The processed CSV validator checks required fields, nulls, duplicate rows and
periods, positive finite prices, date/quarter consistency, and chronological
ordering. The export validator compares the generated JSON structure and values
with a freshly derived payload from the processed CSV. Compose also exposes
`db-check` for a database row-count check.

The export currently guards the reviewed snapshot: 126 continuous observations
from 1995 Q1 to 2026 Q2. When MIVAU adds or revises periods, inspect the changed
source and update the snapshot count and end period in
`src/exporting/export_housing_json.py`, regenerate the JSON, and review the
annual partial-year behavior and tests. Update this README's period summary
after verifying the new source data. These snapshot expectations are separate
from general data quality checks.

## JSON contract

The output schema is documented in [docs/housing-json-schema.md](docs/housing-json-schema.md).
It includes source attribution, quarterly observations, and arithmetic annual
averages with `observedQuarters` and `isPartial`. The current 2026 average is
therefore explicitly partial. The frontend labels partial annual values and
displays prices in EUR/m².

## Repository layout

```text
docker/postgres/init/   PostgreSQL base schema
docs/                   JSON schema and data contract
frontend/               React + TypeScript + Vite dashboard
src/ingestion/          Official CSV ingestion
src/transformation/     Murcia/free-market filtering and cleaning
src/validation/         Processed CSV and JSON checks
src/loading/            PostgreSQL upsert and database check
src/exporting/          Deterministic static JSON export
src/pipeline/           Stage orchestration
tests/                  Python unit tests
```

## Known limitations

- The original DDL and verified formulas for `vw_housing_analysis` are not in
  this repository. No substitute quarterly variation or price categories are
  claimed or generated.
- The export snapshot guard needs an intentional review when the official source
  changes.
- The source is regional; there are no municipality-level observations here.
- Compose initializes a base table only. The dashboard reads the static JSON,
  not PostgreSQL.
