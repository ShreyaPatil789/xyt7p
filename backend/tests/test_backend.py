import unittest
import os
import sqlite3
from app.data_store import get_available_dates, get_matched_day_profile, get_forecast_evolution
from app.analytics import compute_metrics, get_monthly_analytics_summary
from app.config import DB_PATH

class TestAeroProcureBackend(unittest.TestCase):
    def test_database_exists(self):
        self.assertTrue(os.path.exists(DB_PATH), f"Database must exist at {DB_PATH}")

    def test_available_dates(self):
        dates = get_available_dates()
        self.assertGreaterEqual(len(dates), 28, "January 2026 should have at least 28-31 dates available")
        self.assertIn("2026-01-01", dates)
        self.assertIn("2026-01-15", dates)

    def test_day_profile_matching(self):
        profile = get_matched_day_profile("2026-01-15", "2026-01-14T11:00:00Z")
        self.assertEqual(len(profile), 48, "Must contain 48 settlement periods for a UK delivery day")
        # Check first period
        p1 = profile[0]
        self.assertEqual(p1['settlementPeriod'], 1)
        self.assertIsNotNone(p1['actualGeneration'])
        self.assertIsNotNone(p1['forecastGeneration'])
        self.assertIsNotNone(p1['error'])

    def test_metrics_calculation(self):
        errors = [100.0, -200.0, 50.0, -50.0]
        actuals = [1000.0, 2000.0, 1500.0, 1200.0]
        forecasts = [1100.0, 1800.0, 1550.0, 1150.0]
        metrics = compute_metrics(errors, actuals, forecasts)
        
        self.assertEqual(metrics['count'], 4)
        self.assertEqual(metrics['mae'], 100.0) # (|100| + |-200| + |50| + |-50|) / 4 = 400 / 4 = 100
        self.assertEqual(metrics['bias'], -25.0) # (100 - 200 + 50 - 50) / 4 = -100 / 4 = -25

    def test_monthly_analytics_summary(self):
        summary = get_monthly_analytics_summary(cutoff_hour=11)
        self.assertIn("globalMetrics", summary)
        self.assertIn("dailyBreakdown", summary)
        self.assertIn("settlementPeriodProfiles", summary)
        self.assertEqual(len(summary["settlementPeriodProfiles"]), 48)
        self.assertGreater(summary["globalMetrics"]["mae"], 0.0)
        self.assertGreater(summary["globalMetrics"]["r2"], 0.0)

if __name__ == "__main__":
    unittest.main()
