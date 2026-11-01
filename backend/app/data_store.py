import sqlite3
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.config import DB_PATH, DEFAULT_GATE_CLOSURE_HOUR

def get_connection():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}. Run download script or initialize DB.")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_available_dates() -> List[str]:
    """Returns list of distinct delivery dates available in January 2026."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT settlement_date 
            FROM actual_generation 
            WHERE settlement_date LIKE '2026-01-%'
            ORDER BY settlement_date ASC
        """)
        dates = [row['settlement_date'] for row in cur.fetchall()]
        return dates
    finally:
        conn.close()

def get_actuals_for_date(delivery_date: str) -> List[Dict[str, Any]]:
    """Returns actual generation records for a given delivery date (48 settlement periods)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                publish_time,
                start_time,
                settlement_date,
                settlement_period,
                generation
            FROM actual_generation
            WHERE settlement_date = ?
            ORDER BY settlement_period ASC, start_time ASC
        """, (delivery_date,))
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()

def get_forecasts_for_cutoff(delivery_date: str, cutoff_iso: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns the latest available wind forecast for each target hour of delivery_date,
    published on or before cutoff_iso.
    If cutoff_iso is None, defaults to D-1 11:00 UTC (standard Day-Ahead gate closure).
    """
    dt = datetime.strptime(delivery_date, "%Y-%m-%d")
    if cutoff_iso is None:
        day_ahead_dt = dt - timedelta(days=1)
        cutoff_iso = f"{day_ahead_dt.strftime('%Y-%m-%d')}T{DEFAULT_GATE_CLOSURE_HOUR:02d}:00:00Z"

    start_bound = f"{delivery_date}T00:00:00Z"
    end_bound = f"{delivery_date}T23:59:59Z"

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            WITH ranked AS (
                SELECT 
                    start_time,
                    publish_time,
                    generation,
                    ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC) as rn
                FROM forecast_generation
                WHERE start_time >= ? AND start_time <= ?
                  AND publish_time <= ?
            )
            SELECT start_time, publish_time, generation
            FROM ranked
            WHERE rn = 1
            ORDER BY start_time ASC
        """, (start_bound, end_bound, cutoff_iso))
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()

def get_forecast_evolution(delivery_date: str) -> Dict[str, Any]:
    """
    Fetches forecasts published at distinct lead times / horizons targeting delivery_date:
    e.g., D-2 (48h), D-1 07:00, D-1 11:00 (Auction Cutoff), D-1 17:00, D-0 06:00 (Intraday).
    """
    dt = datetime.strptime(delivery_date, "%Y-%m-%d")
    d_minus_2 = (dt - timedelta(days=2)).strftime("%Y-%m-%d")
    d_minus_1 = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
    d_day = delivery_date

    horizons = {
        "D-2 (48h Lead)": f"{d_minus_2}T12:00:00Z",
        "D-1 Early Morning (07:00)": f"{d_minus_1}T07:00:00Z",
        "D-1 Auction Gate (11:00)": f"{d_minus_1}T11:00:00Z",
        "D-1 Evening (17:00)": f"{d_minus_1}T17:00:00Z",
        "D-0 Intraday (06:00)": f"{d_day}T06:00:00Z",
    }

    evolution_data = {}
    for label, cutoff in horizons.items():
        fc = get_forecasts_for_cutoff(delivery_date, cutoff)
        evolution_data[label] = {
            "cutoff": cutoff,
            "forecasts": fc
        }
    return evolution_data

def get_matched_day_profile(delivery_date: str, cutoff_iso: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Matches actuals and forecasts for each of the 48 settlement periods.
    Linear interpolation is used for half-hourly forecast values between hourly WINDFOR forecasts.
    Computes error, absolute error, percentage error, and direction.
    """
    actuals = get_actuals_for_date(delivery_date)
    forecasts = get_forecasts_for_cutoff(delivery_date, cutoff_iso)
    
    # Map start_time -> forecast generation and publish_time
    fc_map = {f['start_time']: f for f in forecasts}
    
    # Sort hourly forecast keys for interpolation
    sorted_fc_times = sorted(fc_map.keys())
    
    matched_profile = []
    for act in actuals:
        sp = act['settlement_period']
        st = act['start_time']
        act_gen = act['generation']
        
        # Determine matching forecast
        # If exact match exists (e.g. :00:00Z)
        fc_val = None
        pub_time = None
        
        if st in fc_map:
            fc_val = fc_map[st]['generation']
            pub_time = fc_map[st]['publish_time']
        else:
            # st has minute :30:00Z. Interpolate between previous :00 and next :00
            try:
                base_dt = datetime.strptime(st, "%Y-%m-%dT%H:%M:%SZ")
                prev_hour = base_dt.replace(minute=0).strftime("%Y-%m-%dT%H:%M:%SZ")
                next_hour = (base_dt.replace(minute=0) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
                
                prev_fc = fc_map.get(prev_hour)
                next_fc = fc_map.get(next_hour)
                
                if prev_fc and next_fc:
                    fc_val = round((prev_fc['generation'] + next_fc['generation']) / 2.0, 1)
                    pub_time = prev_fc['publish_time']
                elif prev_fc:
                    fc_val = prev_fc['generation']
                    pub_time = prev_fc['publish_time']
                elif next_fc:
                    fc_val = next_fc['generation']
                    pub_time = next_fc['publish_time']
            except Exception:
                fc_val = None
                
        error = round(fc_val - act_gen, 1) if (fc_val is not None and act_gen is not None) else None
        abs_err = abs(error) if error is not None else None
        pct_err = round((abs_err / act_gen * 100.0), 2) if (abs_err is not None and act_gen > 10.0) else None
        
        direction = "EXACT"
        if error is not None:
            if error > 20.0:
                direction = "OVER_FORECAST"  # Shortfall risk in real-time
            elif error < -20.0:
                direction = "UNDER_FORECAST"  # Excess risk in real-time
        
        matched_profile.append({
            "settlementPeriod": sp,
            "startTime": st,
            "actualGeneration": act_gen,
            "forecastGeneration": fc_val,
            "publishTime": pub_time,
            "error": error,
            "absError": abs_err,
            "pctError": pct_err,
            "direction": direction
        })
        
    return matched_profile
