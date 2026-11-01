from fastapi import APIRouter, Query
from app.analytics import get_monthly_analytics_summary, get_lead_time_sensitivity

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/monthly-summary")
def get_monthly_summary(
    cutoff_hour: int = Query(11, ge=0, le=23, description="Decision cutoff hour on D-1 (default 11 for 11:00 UTC)")
):
    """
    Returns comprehensive quantitative forecast evaluation across all 31 days of January 2026:
    - Global scorecards (MAE, RMSE, MAPE, WAPE, Bias, NMAE, Quantiles)
    - Daily performance table (identifying high volatility vs calm forecast days)
    - Settlement Period diurnal profiling (SPs 1-48 analysis)
    - Forecast error histogram distribution
    """
    summary = get_monthly_analytics_summary(cutoff_hour=cutoff_hour)
    return summary

@router.get("/lead-time-curve")
def get_lead_time_curve(
    sample_date: str = Query("2026-01-15", description="Delivery date to evaluate lead-time sensitivity")
):
    """
    Evaluates forecast accuracy degradation as lead time increases (48h, 36h, 24h, 16h, 6h ahead).
    """
    curve = get_lead_time_sensitivity(sample_date=sample_date)
    return {
        "deliveryDate": sample_date,
        "leadTimeSensitivity": curve
    }

