import urllib.request
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.config import FUELHH_ENDPOINT, WINDFOR_ENDPOINT, DB_PATH

class ElexonClient:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.headers = {"User-Agent": "AeroProcure-UK-Forecasting/1.0"}

    def _fetch_url(self, url: str) -> Optional[List[Dict[str, Any]]]:
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=25) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"Error fetching from Elexon API ({url}): {e}")
            return None
        return None

    def fetch_live_fuelhh(self, date_from_iso: str, date_to_iso: str) -> List[Dict[str, Any]]:
        """Queries Elexon FUELHH stream endpoint and filters for fuelType=='WIND'."""
        url = f"{FUELHH_ENDPOINT}?publishDateTimeFrom={date_from_iso}&publishDateTimeTo={date_to_iso}"
        data = self._fetch_url(url)
        if not data:
            return []
        wind_records = [
            d for d in data 
            if d.get("fuelType") == "WIND"
        ]
        return wind_records

    def fetch_live_windfor(self, date_from_iso: str, date_to_iso: str) -> List[Dict[str, Any]]:
        """Queries Elexon WINDFOR stream endpoint."""
        url = f"{WINDFOR_ENDPOINT}?publishDateTimeFrom={date_from_iso}&publishDateTimeTo={date_to_iso}"
        data = self._fetch_url(url)
        return data or []

    def sync_range(self, start_date: str, end_date: str) -> Dict[str, int]:
        """
        Synchronizes live data from Elexon and persists to SQLite database.
        """
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        from_iso = f"{start_date}T00:00:00Z"
        to_iso = f"{end_date}T23:59:59Z"
        
        fuel_rows = self.fetch_live_fuelhh(from_iso, to_iso)
        fc_rows = self.fetch_live_windfor(from_iso, to_iso)
        
        saved_actuals = 0
        if fuel_rows:
            batch = [
                (
                    r.get('publishTime'),
                    r.get('startTime'),
                    r.get('settlementDate'),
                    r.get('settlementPeriod'),
                    float(r.get('generation', 0))
                ) for r in fuel_rows
            ]
            cur.executemany("""
                INSERT OR REPLACE INTO actual_generation (publish_time, start_time, settlement_date, settlement_period, generation)
                VALUES (?, ?, ?, ?, ?)
            """, batch)
            saved_actuals = len(batch)
            
        saved_forecasts = 0
        if fc_rows:
            batch = [
                (
                    r.get('publishTime'),
                    r.get('startTime'),
                    float(r.get('generation', 0))
                ) for r in fc_rows if r.get('generation') is not None
            ]
            cur.executemany("""
                INSERT OR REPLACE INTO forecast_generation (publish_time, start_time, generation)
                VALUES (?, ?, ?)
            """, batch)
            saved_forecasts = len(batch)
            
        conn.commit()
        conn.close()
        return {
            "actualsSaved": saved_actuals,
            "forecastsSaved": saved_forecasts
        }
