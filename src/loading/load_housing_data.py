from pathlib import Path
import os

import pandas as pd
import psycopg
from dotenv import load_dotenv

load_dotenv()

INPUT_PATH = Path("data/processed/housing_prices_clean.csv")

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}


def main():
    print("Cargando CSV procesado...")

    df = pd.read_csv(INPUT_PATH)
    print(f"Registros encontrados: {len(df)}")

    with psycopg.connect(**DB_CONFIG) as connection:
        with connection.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE housing_prices;")

            for row in df.itertuples(index=False):
                cursor.execute(
                    """
                    INSERT INTO housing_prices (
                        ano,
                        trimestre,
                        fecha,
                        precio_m2,
                        regimen,
                        comunidad_autonoma
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        row.ano,
                        row.trimestre,
                        row.fecha,
                        row.precio_m2,
                        row.regimen,
                        row.comunidad_autonoma,
                    ),
                )

        connection.commit()

    print("Datos cargados correctamente en PostgreSQL.")


if __name__ == "__main__":
    main()
