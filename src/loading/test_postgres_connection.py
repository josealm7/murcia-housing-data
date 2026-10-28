import csv
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv()

INPUT_PATH = Path("data/processed/housing_prices_clean.csv")


def main():
    config = {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "connect_timeout": 5,
    }
    with psycopg.connect(**config) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM housing_prices")
            loaded_count = cursor.fetchone()[0]

    if INPUT_PATH.is_file():
        with INPUT_PATH.open(newline="", encoding="utf-8") as csv_file:
            expected_count = sum(1 for _ in csv.DictReader(csv_file))
        if loaded_count != expected_count:
            raise SystemExit(
                f"PostgreSQL row count mismatch: expected {expected_count}, found {loaded_count}."
            )
        print(f"PostgreSQL is ready; housing_prices contains {loaded_count} rows.")
    else:
        print(f"PostgreSQL is ready; housing_prices contains {loaded_count} rows.")


if __name__ == "__main__":
    main()
