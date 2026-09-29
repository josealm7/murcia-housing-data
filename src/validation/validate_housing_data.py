from pathlib import Path
import pandas as pd

INPUT_PATH = Path("data/processed/housing_prices_clean.csv")


def main():
    print("Cargando datos procesados...")
    df = pd.read_csv(INPUT_PATH)

    print(f"\nFilas: {len(df)}")
    print(f"Columnas: {list(df.columns)}")

    print("\nValores nulos:")
    print(df.isnull().sum())

    print("\nDuplicados:")
    print(df.duplicated().sum())

    print("\nPrecio mínimo:", df["precio_m2"].min())
    print("Precio máximo:", df["precio_m2"].max())
    print("Precio medio:", round(df["precio_m2"].mean(), 2))

    print("\nRango temporal:")
    print(df["fecha"].min(), "→", df["fecha"].max())

    print("\nÚltimos registros:")
    print(df.tail())


if __name__ == "__main__":
    main()
