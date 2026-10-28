import json
import unittest

from src.exporting.export_housing_json import (
    DEFAULT_INPUT,
    DEFAULT_OUTPUT,
    ExportValidationError,
    _read_csv,
    build_payload,
)


class HousingJsonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = _read_csv(DEFAULT_INPUT)

    def test_generated_json_matches_processed_csv(self):
        expected = build_payload(self.rows)
        actual = json.loads(DEFAULT_OUTPUT.read_text(encoding="utf-8"))
        self.assertEqual(actual, expected)

    def test_partial_year_is_explicit(self):
        payload = build_payload(self.rows)
        latest = payload["annualAverages"][-1]
        self.assertEqual(latest["year"], 2026)
        self.assertEqual(latest["observedQuarters"], 2)
        self.assertTrue(latest["isPartial"])

    def test_unverified_metrics_are_not_exported(self):
        payload = build_payload(self.rows)
        observation_fields = set(payload["observations"][0])
        self.assertNotIn("variacion_pct", observation_fields)
        self.assertNotIn("categoria_precio", observation_fields)
        self.assertNotIn("quarterlyVariation", observation_fields)
        self.assertNotIn("priceCategory", observation_fields)

    def test_duplicate_period_is_rejected(self):
        rows = [dict(row) for row in self.rows]
        rows[1]["ano"] = rows[0]["ano"]
        rows[1]["trimestre"] = rows[0]["trimestre"]
        rows[1]["fecha"] = rows[0]["fecha"]
        with self.assertRaisesRegex(ExportValidationError, "duplicate observation date"):
            build_payload(rows)

    def test_non_numeric_price_is_rejected(self):
        rows = [dict(row) for row in self.rows]
        rows[0]["precio_m2"] = "not-a-price"
        with self.assertRaisesRegex(ExportValidationError, "must be numeric"):
            build_payload(rows)


if __name__ == "__main__":
    unittest.main()
