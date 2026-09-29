from pathlib import Path

import pandas as pd


INPUT_PATH = Path("data/raw/housing_prices.csv")
OUTPUT_PATH = Path("data/processed/housing_prices_clean.csv")


def main():
    print("Cargando datos raw...")

    df = pd.read_csv(INPUT_PATH)

    # Normalizar nombres de columnas
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("á", "a")
        .str.replace("é", "e")
        .str.replace("í", "i")
        .str.replace("ó", "o")
        .str.replace("ú", "u")
        .str.replace("ñ", "n")
    )

    # Seleccionar únicamente datos de la Región de Murcia
    df = df[
        df["comunidad_autonoma"]
        .astype(str)
        .str.contains("Murcia", case=False, na=False)
    ].copy()

    # Mantener únicamente vivienda libre
    df = df[df["regimen"] == "Libre"].copy()

    # Crear fecha temporal
    df["fecha"] = pd.PeriodIndex(
        df["ano"].astype(str) + "Q" + df["trimestre"].astype(str),
        freq="Q"
    ).to_timestamp()

    # Renombrar valor
    df = df.rename(columns={"valor": "precio_m2"})

    # Seleccionar columnas relevantes
    df = df[
        [
            "ano",
            "trimestre",
            "fecha",
            "precio_m2",
            "regimen",
            "comunidad_autonoma",
        ]
    ]

    # Ordenar cronológicamente
    df = df.sort_values("fecha")

    # Eliminar registros sin precio
    df = df.dropna(subset=["precio_m2"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"Filas procesadas: {len(df)}")
    print(f"Datos guardados en: {OUTPUT_PATH}")
    print()
    print(df.tail())


if __name__ == "__main__":
    main()