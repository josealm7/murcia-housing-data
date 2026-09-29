from pathlib import Path

import pandas as pd


URL = (
    "https://cdn.mivau.gob.es/portal-web-mivau/"
    "Datos_MIVAU/CSV/VDP006_01.csv"
)

OUTPUT_PATH = Path("data/raw/housing_prices.csv")


def main():
    print("Descargando datos de vivienda...")

    df = pd.read_csv(URL, sep=";", encoding="utf-8")

    print(f"Filas descargadas: {len(df)}")
    print(f"Columnas: {list(df.columns)}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"Datos guardados en: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
