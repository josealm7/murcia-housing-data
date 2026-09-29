# 🏠 Murcia Housing Data

End-to-end data pipeline and Business Intelligence project focused on analyzing the evolution of housing values in the **Region of Murcia, Spain**.

The project ingests official public housing valuation data, processes and validates it with Python, stores it in PostgreSQL, performs analytical transformations with SQL, and exposes the resulting data through a **Power BI dashboard**.

The main objective is to demonstrate practical skills across the complete data workflow:

**Data Ingestion → Transformation → Validation → PostgreSQL → SQL Analytics → Power BI**

---

## 📊 Dashboard

The Power BI dashboard provides an overview of the evolution of housing values in the Region of Murcia.

It includes:

* **Current housing value (€ / m²)**
* **Quarter-over-quarter variation**
* **Quarterly housing value evolution**
* **Annual average housing value**
* **Recent quarterly observations**
* **Price-level categorization**

The dashboard is designed to provide both a high-level overview and detailed historical information.

> **Data granularity:** the source dataset provides information at the **Region of Murcia level**. This project does not contain municipality-level housing prices.

---

## 🏗️ Architecture

```text
┌─────────────────────────────┐
│ Official public dataset     │
│ Ministerio de Vivienda      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Python / Pandas             │
│                             │
│ • Ingestion                 │
│ • Cleaning                  │
│ • Transformation            │
│ • Validation                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ PostgreSQL                  │
│                             │
│ • Relational storage        │
│ • SQL analysis              │
│ • Analytical view           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Power BI                    │
│                             │
│ • KPIs                      │
│ • Time-series analysis      │
│ • Annual analysis           │
│ • Detailed table            │
└─────────────────────────────┘
```

---

# 📌 Project Overview

This project uses official Spanish housing valuation data to analyze the historical evolution of housing values in the Region of Murcia.

The original dataset contains quarterly observations and includes information such as:

* Year
* Quarter
* Housing value
* Housing regime
* Province
* Autonomous community
* Autonomous community code

The project filters the dataset to:

* **Autonomous community:** Region of Murcia
* **Housing regime:** Libre

The resulting dataset contains **126 quarterly observations**, covering the period from **1995 to 2026 Q2**.

---

# 🗂️ Data Source

The project uses the official dataset:

**Valor tasado de la vivienda**

Published through the Spanish Government's open data infrastructure and provided by the **Ministerio de Vivienda y Agenda Urbana**.

Official dataset:

https://datos.gob.es/es/catalogo/e05233601-valor-tasado-de-la-vivienda

Raw CSV:

https://cdn.mivau.gob.es/portal-web-mivau/Datos_MIVAU/CSV/VDP006_01.csv

The project does not modify the original source data. The raw dataset is downloaded and stored locally before processing.

---

# 🔄 Data Pipeline

## 1. Ingestion

File:

```text
src/ingestion/fetch_housing_data.py
```

The ingestion script downloads the official CSV dataset using Pandas and stores it in:

```text
data/raw/housing_prices.csv
```

The raw data is intentionally excluded from Git version control because it is reproducible from the official source.

---

## 2. Transformation

File:

```text
src/transformation/clean_housing_data.py
```

The transformation process:

1. Loads the raw CSV.
2. Standardizes column names.
3. Filters observations belonging to the Region of Murcia.
4. Filters the `Libre` housing regime.
5. Creates a proper quarterly date field.
6. Renames the housing value column to `precio_m2`.
7. Removes missing price observations.
8. Sorts the data chronologically.
9. Saves the processed dataset.

Output:

```text
data/processed/housing_prices_clean.csv
```

---

## 3. Data Validation

File:

```text
src/validation/validate_housing_data.py
```

The validation stage checks:

* Number of records
* Expected columns
* Missing values
* Duplicate records
* Minimum and maximum prices
* Date range

The processed dataset currently contains:

| Metric               |       Result |
| -------------------- | -----------: |
| Records              |          126 |
| Missing values       |            0 |
| Duplicate records    |            0 |
| Earliest observation |      1995 Q1 |
| Latest observation   |      2026 Q2 |
| Minimum value        |   €421.00/m² |
| Maximum value        | €1,618.10/m² |

---

# 🐘 PostgreSQL

The processed data is loaded into PostgreSQL.

Main table:

```text
housing_prices
```

Schema:

```text
id
ano
trimestre
fecha
precio_m2
regimen
comunidad_autonoma
```

The database also contains an analytical SQL view:

```text
vw_housing_analysis
```

This view adds calculated analytical fields such as:

* `categoria_precio`
* `precio_m2_anterior`
* `variacion_pct`

The previous-quarter comparison is calculated using the SQL window function:

```sql
LAG(precio_m2) OVER (ORDER BY fecha)
```

This allows the dashboard to display quarter-over-quarter changes without calculating the historical comparison manually in Power BI.

---

# 📈 SQL Analysis

The SQL layer is used to transform the raw relational data into information suitable for analysis.

Examples include:

### Annual average housing value

```sql
SELECT
    ano,
    ROUND(AVG(precio_m2), 2) AS precio_medio_anual
FROM housing_prices
GROUP BY ano
ORDER BY ano;
```

### Quarter-over-quarter variation

The analytical view uses `LAG()` to compare every observation with the previous quarter.

```sql
LAG(precio_m2) OVER (
    ORDER BY fecha
)
```

The resulting percentage variation is calculated from the current and previous observations.

### Price categorization

Housing values are classified into four categories:

```text
Bajo
Medio
Alto
Muy alto
```

These categories are used for analytical visualization in Power BI.

---

# 📊 Power BI

The processed analytical view is connected to Power BI using the PostgreSQL connector.

The dashboard contains several visualizations.

### KPI — Current housing value

Displays the latest available housing value:

**€1,350.10/m²**

### KPI — Quarterly variation

Displays the change compared with the previous quarter:

**+1.50%**

### Quarterly evolution

A line chart shows the historical evolution of housing values from 1995 to 2026 Q2.

### Annual average

A column chart displays the average housing value for each year.

### Recent observations

A table provides the latest quarterly observations together with:

* Date
* Housing value
* Quarterly variation
* Price category

---

# 📌 Current Data Snapshot

The latest available observations are:

| Period  |        Value |
| ------- | -----------: |
| 2025 Q2 | €1,185.00/m² |
| 2025 Q3 | €1,216.30/m² |
| 2025 Q4 | €1,264.00/m² |
| 2026 Q1 | €1,330.20/m² |
| 2026 Q2 | €1,350.10/m² |

The latest observation represents a **1.50% increase compared with the previous quarter**.

---

# 🧰 Technologies

### Programming

* Python 3
* Pandas

### Database

* PostgreSQL
* SQL

### Business Intelligence

* Microsoft Power BI

### Development

* Git
* GitHub
* VS Code
* WSL2

### Python libraries

* `pandas`
* `requests`
* `psycopg`
* `python-dotenv`

---

# 📁 Project Structure

```text
murcia-housing-data/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── docs/
│
├── notebooks/
│
├── sql/
│
├── src/
│   ├── ingestion/
│   │   └── fetch_housing_data.py
│   │
│   ├── transformation/
│   │   └── clean_housing_data.py
│   │
│   ├── validation/
│   │   └── validate_housing_data.py
│   │
│   └── loading/
│       ├── load_housing_data.py
│       └── test_postgres_connection.py
│
├── tests/
│
├── .gitignore
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone <repository-url>
cd murcia-housing-data
```

## 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

### Linux / WSL

```bash
source .venv/bin/activate
```

### Windows

```powershell
.venv\Scripts\activate
```

---

## 3. Install dependencies

```bash
pip install pandas requests psycopg[binary] python-dotenv
```

---

# 🔐 Environment Variables

Database credentials are not stored in the repository.

Create a local `.env` file:

```env
DB_HOST=localhost
DB_NAME=murcia_housing
DB_USER=murcia_user
DB_PASSWORD=your_password
```

The `.env` file is excluded from version control through `.gitignore`.

---

# ▶️ Running the Pipeline

### Download the source data

```bash
python src/ingestion/fetch_housing_data.py
```

### Transform the data

```bash
python src/transformation/clean_housing_data.py
```

### Validate the processed dataset

```bash
python src/validation/validate_housing_data.py
```

### Load the data into PostgreSQL

```bash
python src/loading/load_housing_data.py
```

The loading process performs a full refresh of the `housing_prices` table.

---

# 🔍 Data Quality

The pipeline performs several basic data-quality checks before the data reaches the database.

Current validation results:

```text
Records:             126
Missing values:        0
Duplicate records:     0
Minimum price:     421.00 €/m²
Maximum price:    1618.10 €/m²
```

This ensures that the dataset used by PostgreSQL and Power BI has passed a basic validation stage.

---

# 🔒 Security

Sensitive database credentials are handled through environment variables.

The repository does **not** contain:

* Database passwords
* `.env` files
* Local virtual environments
* Raw datasets
* Processed datasets

These files are excluded through `.gitignore`.

---

# 🚀 Possible Future Improvements

The current project intentionally focuses on a simple and reproducible data pipeline.

Potential future improvements include:

* Automated scheduled data ingestion
* Incremental database loading
* Automated data-quality tests
* dbt transformations
* Airflow orchestration
* Dockerized PostgreSQL environment
* Additional housing datasets
* Municipality-level analysis if an appropriate source becomes available
* Additional Power BI measures and interactive filters
* Automated pipeline execution using CI/CD

These features are not currently implemented.

---

# 🎯 Project Goals

This project was created as a portfolio project to demonstrate practical experience with:

* Data ingestion
* Data cleaning
* Data validation
* Relational databases
* PostgreSQL
* SQL analytical queries
* Window functions
* Python/Pandas
* Business Intelligence
* Power BI
* Data pipeline design
* Reproducible data workflows

It is designed as a small end-to-end example of how raw public data can be transformed into an analytical dataset and ultimately into a business intelligence dashboard.
