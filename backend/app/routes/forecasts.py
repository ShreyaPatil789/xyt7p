from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from app.data_store import (
    get_available_dates,
    get_matched_day_profile,
    get_forecast_evolution,
    get_forecasts_for_cutoff
)
from app.analytics import compute_metrics
from app.elexon_client import ElexonClient

router = APIRouter(prefix="/api/forecasts", tags=["Forecasts"])

@router.get("/dates")
def list_available_dates():
    """Returns available delivery dates in January 2026."""
    dates = get_available_dates()
    return {
        "success": True,
        "totalDates": len(dates),
        "dates": dates,
        "defaultDate": dates[14] if len(dates) > 14 else (dates[0] if dates else "2026-01-15")
    }

@router.get("/day")
def get_day_forecast(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    cutoff_time: Optional[str] = Query(None, description="ISO timestamp of decision gate cutoff. If omitted, defaults to D-1 11:00 UTC.")
):
    """
    Returns actual vs latest day-ahead forecast profile for each of the 48 settlement periods on the given date,
    along with day-level accuracy scorecards.
    """
    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
        
    if cutoff_time is None:
        day_ahead_dt = dt - timedelta(days=1)
        cutoff_time = f"{day_ahead_dt.strftime('%Y-%m-%d')}T11:00:00Z"
        
    profile = get_matched_day_profile(date, cutoff_time)
    if not profile:
        raise HTTPException(status_code=404, detail=f"No data available for delivery date {date}")
        
    errs = [p['error'] for p in profile if p['error'] is not None]
    acts = [p['actualGeneration'] for p in profile if p['error'] is not None]
    fcs = [p['forecastGeneration'] for p in profile if p['error'] is not None]
    
    metrics = compute_metrics(errs, acts, fcs)
    
    return {
        "deliveryDate": date,
        "decisionCutoffTime": cutoff_time,
        "settlementPeriodsCount": len(profile),
        "dayMetrics": metrics,
        "profile": profile
    }

@router.get("/evolution")
def get_day_forecast_evolution(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)")
):
    """
    Returns forecast curves across different forecast publish horizons (D-2, D-1 morning, D-1 gate, D-1 evening, D-0)
    to inspect forecast updates and volatility leading up to delivery.
    """
    evolution = get_forecast_evolution(date)
    return {
        "deliveryDate": date,
        "evolution": evolution
    }

@router.post("/sync")
def sync_elexon_data(
    start_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-05", description="End date (YYYY-MM-DD)")
):
    """Triggers an on-demand sync from Elexon BMRS API into the SQLite database."""
    client = ElexonClient()
    result = client.sync_range(start_date, end_date)
    return {
        "status": "success",
        "syncedRange": f"{start_date} to {end_date}",
        "result": result
    }

