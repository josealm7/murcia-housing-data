# Murcia Housing Data

Data pipeline and BI dashboard for analyzing the evolution of housing prices in the Region of Murcia.

## Overview

This project builds a small end-to-end data pipeline using official Spanish housing valuation data.

The pipeline covers:

- Data ingestion from an official public dataset
- Data cleaning and transformation with Python and Pandas
- Data validation
- Loading into PostgreSQL
- SQL analysis and analytical views
- Power BI dashboard for data visualization

## Architecture

```text
Official housing data
        │
        ▼
   Python / Pandas
        │
        ├── Ingestion
        ├── Cleaning
        └── Validation
        │
        ▼
    PostgreSQL
        │
        ├── SQL analysis
        └── Analytical view
        │
        ▼
     Power BI
        │
        ▼
 Interactive dashboard
Dataset

Source: Ministerio de Vivienda y Agenda Urbana through the Spanish government's open data portal.

Dataset: Valor tasado de la vivienda

The analysis focuses on the Región de Murcia and uses the Libre housing regime.

The dataset contains quarterly housing valuation data from 1995 onwards.

Note: the dataset used in this project is regional-level data. It does not provide municipality-level prices.

Technologies
Python
Pandas
PostgreSQL
SQL
Power BI
Git / GitHub
Project structure
murcia-housing-data/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── src/
│   ├── ingestion/
│   ├── transformation/
│   ├── validation/
│   └── loading/
│
├── sql/
├── docs/
├── tests/
├── notebooks/
│
├── .gitignore
└── README.md
Data pipeline
1. Ingestion

src/ingestion/fetch_housing_data.py

Downloads the official CSV dataset and stores it locally as raw data.

2. Transformation

src/transformation/clean_housing_data.py

Standardizes column names
Filters the Region of Murcia
Filters the Libre housing regime
Creates a quarterly date field
Renames the housing valuation field
Removes invalid or missing values
Produces the processed dataset
3. Validation

src/validation/validate_housing_data.py

Checks the processed dataset for:

Row count
Expected columns
Missing values
Duplicate records
Price range
Date range
4. Loading

src/loading/load_housing_data.py

Loads the processed data into PostgreSQL.

Database credentials are managed through environment variables and are not stored in the repository.

SQL analysis

The PostgreSQL layer includes analytical queries and a view used by Power BI.

The analysis includes:

Quarterly housing price evolution
Annual average prices
Quarter-over-quarter variation
Price categories
Previous-period comparisons using SQL window functions
Power BI dashboard

The dashboard includes:

Current housing price per m²
Quarterly variation
Quarterly price evolution
Annual average price
Recent quarterly data table

All visualizations refer to the Region of Murcia.

Key result

The latest available observation in the dataset used by the project is:

2026 Q2 — €1,350.10/m²

The quarterly variation compared with the previous quarter is:

+1.50%

Reproducibility

The project is designed so that the data pipeline can be executed locally from ingestion through PostgreSQL loading.

Database credentials should be provided through a local .env file.

Example:

DB_HOST=localhost
DB_NAME=murcia_housing
DB_USER=murcia_user
DB_PASSWORD=your_password

The .env file is excluded from version control.

Data source

Official dataset:

datos.gob.es — Valor tasado de la vivienda

Raw CSV provided by the Spanish Ministry of Housing and Urban Agenda.

Purpose

This project was created as a portfolio project to demonstrate practical skills in data ingestion, transformation, validation, SQL, relational databases and business intelligence.
