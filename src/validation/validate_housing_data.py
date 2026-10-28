from pathlib import Path
import math

import pandas as pd

INPUT_PATH = Path("data/processed/housing_prices_clean.csv")


REQUIRED_COLUMNS = {
    "ano",
    "trimestre",
    "fecha",
    "precio_m2",
    "regimen",
    "comunidad_autonoma",
}


def main() -> int:
    print("Cargando datos procesados...")
    try:
        df = pd.read_csv(INPUT_PATH)
    except OSError as error:
        print(f"Validación fallida: no se pudo leer {INPUT_PATH}: {error}")
        return 1

    errors = []
    missing_columns = sorted(REQUIRED_COLUMNS - set(df.columns))
    if missing_columns:
        print("Columnas ausentes:", ", ".join(missing_columns))
        return 1
    if df.empty:
        print("Validación fallida: el CSV procesado no contiene filas.")
        return 1

    print(f"\nFilas: {len(df)}")
    print(f"Columnas: {list(df.columns)}")

    null_counts = df[list(REQUIRED_COLUMNS)].isnull().sum()
    print("\nValores nulos:")
    print(null_counts)
    if null_counts.any():
        errors.append("hay valores nulos en columnas requeridas")

    print("\nDuplicados:")
    duplicate_rows = int(df.duplicated().sum())
    duplicate_periods = int(df.duplicated(subset=["ano", "trimestre"]).sum())
    print(duplicate_rows)
    if duplicate_rows or duplicate_periods:
        errors.append(
            f"hay {duplicate_rows} filas duplicadas y {duplicate_periods} periodos duplicados"
        )

    if not df["regimen"].eq("Libre").all():
        errors.append("hay observaciones cuyo régimen no es 'Libre'")
    if not df["comunidad_autonoma"].eq("Murcia, Region de").all():
        errors.append("hay observaciones fuera de 'Murcia, Region de'")

    prices = pd.to_numeric(df["precio_m2"], errors="coerce")
    finite_prices = prices.map(
        lambda value: pd.notna(value) and math.isfinite(float(value))
    )
    invalid_prices = prices.isna() | ~finite_prices | (prices <= 0)
    if invalid_prices.any():
        errors.append(f"hay {int(invalid_prices.sum())} precios no numéricos, no finitos o no positivos")

    years = pd.to_numeric(df["ano"], errors="coerce")
    quarters = pd.to_numeric(df["trimestre"], errors="coerce")
    dates = pd.to_datetime(df["fecha"], errors="coerce")
    valid_quarters = quarters.isin([1, 2, 3, 4])
    invalid_dates = dates.isna()
    mismatched_periods = (
        years.isna()
        | ~valid_quarters
        | invalid_dates
        | (dates.dt.year != years)
        | (dates.dt.month != ((quarters - 1) * 3 + 1))
        | (dates.dt.day != 1)
    )
    if mismatched_periods.any():
        errors.append(f"hay {int(mismatched_periods.sum())} fechas que no coinciden con año/trimestre")
    if not dates.is_monotonic_increasing:
        errors.append("las observaciones no están ordenadas cronológicamente")

    print("\nPrecio mínimo:", prices.min())
    print("Precio máximo:", prices.max())
    print("Precio medio:", round(prices.mean(), 2))

    print("\nRango temporal:")
    print(df["fecha"].min(), "→", df["fecha"].max())

    print("\nÚltimos registros:")
    print(df.tail())

    if errors:
        print("\nValidación fallida:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("\nValidación correcta.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
