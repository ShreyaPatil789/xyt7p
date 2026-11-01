"""
Script to download January 2026 Elexon BMRS dataset:
- FUELHH (Half-hourly generation by fuel type, filtered to 'WIND')
- WINDFOR (Wind generation forecasts with publishTime and startTime)
Stores in SQLite database: backend/data/elexon_jan2026.db
"""

import os
import sys
import time
import json
import sqlite3
import urllib.request
import urllib.error
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "elexon_jan2026.db")

def init_db(db_path):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Table for actual wind generation (FUELHH)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS actual_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publish_time TEXT,
        start_time TEXT UNIQUE,
        settlement_date TEXT,
        settlement_period INTEGER,
        generation REAL
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_actual_start ON actual_generation(start_time)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_actual_date ON actual_generation(settlement_date)")
    
    # Table for forecasted wind generation (WINDFOR)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS forecast_generation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publish_time TEXT,
        start_time TEXT,
        generation REAL,
        UNIQUE(publish_time, start_time)
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fc_start ON forecast_generation(start_time)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fc_publish ON forecast_generation(publish_time)")
    
    conn.commit()
    return conn

def fetch_json(url, retries=5, backoff=2.0):
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'UK-Utility-Forecasting-App/1.0'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    raw = resp.read().decode('utf-8')
                    return json.loads(raw)
        except Exception as e:
            print(f"  [Attempt {attempt}/{retries}] Failed fetching {url[:60]}...: {e}")
            if attempt < retries:
                time.sleep(backoff * attempt)
    return None

def download_fuelhh_actuals(conn):
    print("=== Downloading FUELHH Actuals (Jan 2026) ===")
    cur = conn.cursor()
    
    # Check if already populated
    cur.execute("SELECT COUNT(*) FROM actual_generation")
    existing_count = cur.fetchone()[0]
    if existing_count > 1400:
        print(f"FUELHH actuals already cached ({existing_count} rows). Skipping download.")
        return
    
    # Download in 5-day chunks from 2025-12-31 to 2026-02-02
    start_dt = datetime(2025, 12, 31)
    end_dt = datetime(2026, 2, 2)
    chunk_days = 5
    
    current = start_dt
    total_saved = 0
    
    while current < end_dt:
        next_chunk = min(current + timedelta(days=chunk_days), end_dt)
        from_str = current.strftime("%Y-%m-%dT00:00:00Z")
        to_str = next_chunk.strftime("%Y-%m-%dT00:00:00Z")
        url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        
        print(f"Fetching FUELHH: {from_str[:10]} to {to_str[:10]}...")
        data = fetch_json(url)
        if data:
            wind_rows = []
            for row in data:
                if row.get('fuelType') == 'WIND':
                    wind_rows.append((
                        row.get('publishTime'),
                        row.get('startTime'),
                        row.get('settlementDate'),
                        row.get('settlementPeriod'),
                        float(row.get('generation', 0))
                    ))
            cur.executemany("""
            INSERT OR REPLACE INTO actual_generation (publish_time, start_time, settlement_date, settlement_period, generation)
            VALUES (?, ?, ?, ?, ?)
            """, wind_rows)
            conn.commit()
            total_saved += len(wind_rows)
            print(f"  Saved {len(wind_rows)} wind actual records (Total: {total_saved})")
        time.sleep(0.5)
        current = next_chunk
        
    print(f"Total FUELHH wind records in DB: {total_saved}")

def download_windfor_forecasts(conn):
    print("=== Downloading WINDFOR Forecasts (Jan 2026) ===")
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM forecast_generation")
    existing_count = cur.fetchone()[0]
    if existing_count > 15000:
        print(f"WINDFOR forecasts already cached ({existing_count} rows). Skipping download.")
        return
        
    # Download 2-day chunks from 2025-12-30 to 2026-02-01
    start_dt = datetime(2025, 12, 30)
    end_dt = datetime(2026, 2, 1)
    chunk_days = 2
    
    current = start_dt
    total_saved = 0
    
    while current < end_dt:
        next_chunk = min(current + timedelta(days=chunk_days), end_dt)
        from_str = current.strftime("%Y-%m-%dT00:00:00Z")
        to_str = next_chunk.strftime("%Y-%m-%dT00:00:00Z")
        url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        
        print(f"Fetching WINDFOR: {from_str[:10]} to {to_str[:10]}...")
        data = fetch_json(url)
        if data:
            fc_rows = []
            for row in data:
                gen = row.get('generation')
                if gen is not None:
                    fc_rows.append((
                        row.get('publishTime'),
                        row.get('startTime'),
                        float(gen)
                    ))
            cur.executemany("""
            INSERT OR REPLACE INTO forecast_generation (publish_time, start_time, generation)
            VALUES (?, ?, ?)
            """, fc_rows)
            conn.commit()
            total_saved += len(fc_rows)
            print(f"  Saved {len(fc_rows)} forecast records (Total so far: {total_saved})")
        time.sleep(0.5)
        current = next_chunk
        
    print(f"Total WINDFOR forecast records in DB: {total_saved}")

if __name__ == "__main__":
    conn = init_db(DB_PATH)
    download_fuelhh_actuals(conn)
    download_windfor_forecasts(conn)
    
    # Summary
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), MIN(start_time), MAX(start_time) FROM actual_generation")
    print("Actuals stats:", cur.fetchone())
    cur.execute("SELECT COUNT(*), MIN(publish_time), MAX(publish_time) FROM forecast_generation")
    print("Forecasts stats:", cur.fetchone())
    conn.close()
    print("Data download completed successfully!")

