from fastapi import APIRouter, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from app.data_store import get_matched_day_profile

router = APIRouter(prefix="/api/procurement", tags=["Procurement Simulator"])

class ProcurementSimulationRequest(BaseModel):
    deliveryDate: str = Field("2026-01-15", description="Delivery date (YYYY-MM-DD)")
    cutoffTimeIso: Optional[str] = Field(None, description="Decision gate cutoff ISO")
    peakDemandMw: float = Field(34000.0, description="Peak consumer demand in MW")
    offPeakDemandMw: float = Field(22000.0, description="Off-peak consumer demand in MW")
    riskBufferMw: float = Field(1500.0, description="Safety reserve buffer in MW against wind under-generation")

# Standard diurnal shape factor for UK winter demand across 48 settlement periods
# Normalized between 0 (overnight trough SP 7-9) and 1 (evening peak SP 34-36)
DIURNAL_SHAPE = [
    0.15, 0.10, 0.08, 0.05, 0.04, 0.03, 0.02, 0.02, 0.05, 0.12, # SP 1-10 (00:00 - 05:00)
    0.25, 0.45, 0.65, 0.78, 0.85, 0.88, 0.87, 0.85, 0.82, 0.80, # SP 11-20 (05:00 - 10:00)
    0.78, 0.76, 0.75, 0.74, 0.74, 0.75, 0.76, 0.78, 0.80, 0.83, # SP 21-30 (10:00 - 15:00)
    0.88, 0.94, 0.98, 1.00, 0.99, 0.96, 0.90, 0.82, 0.72, 0.60, # SP 31-40 (15:00 - 20:00)
    0.50, 0.42, 0.35, 0.30, 0.25, 0.22, 0.18, 0.15              # SP 41-48 (20:00 - 24:00)
]

@router.post("/simulate")
def simulate_day_ahead_procurement(payload: ProcurementSimulationRequest):
    """
    Simulates Day-Ahead power purchase decisions based on wind forecasts and quantifies
    residual demand to procure (thermal/market) along with real-time imbalance risks.
    """
    delivery_date = payload.deliveryDate
    profile = get_matched_day_profile(delivery_date, payload.cutoffTimeIso)
    
    peak = payload.peakDemandMw
    offpeak = payload.offPeakDemandMw
    buffer = payload.riskBufferMw
    
    results = []
    total_consumer_mwh = 0.0
    total_wind_forecast_mwh = 0.0
    total_wind_actual_mwh = 0.0
    total_base_procured_mwh = 0.0
    total_risk_procured_mwh = 0.0
    total_short_imbalance_mwh = 0.0
    total_long_imbalance_mwh = 0.0
    
    for i, p in enumerate(profile):
        sp = p['settlementPeriod']
        # Synthetic diurnal consumer demand for UK utility
        shape_idx = min(i, len(DIURNAL_SHAPE) - 1)
        shape_val = DIURNAL_SHAPE[shape_idx]
        demand_mw = round(offpeak + (peak - offpeak) * shape_val, 1)
        
        fc_wind = p['forecastGeneration'] or 0.0
        act_wind = p['actualGeneration'] or 0.0
        
        # Base procurement = Demand - Wind Forecast
        base_procure_mw = max(0.0, round(demand_mw - fc_wind, 1))
        # Risk-adjusted procurement = Demand - (Wind Forecast - buffer)
        risk_procure_mw = max(0.0, round(demand_mw - max(0.0, fc_wind - buffer), 1))
        
        # Real-time actual net need = Demand - Actual Wind
        actual_net_need = max(0.0, round(demand_mw - act_wind, 1))
        
        # Real-time imbalance under base procurement
        imbalance_mw = round(base_procure_mw - actual_net_need, 1)
        
        # MWh is MW * 0.5 hours per settlement period
        total_consumer_mwh += demand_mw * 0.5
        total_wind_forecast_mwh += fc_wind * 0.5
        total_wind_actual_mwh += act_wind * 0.5
        total_base_procured_mwh += base_procure_mw * 0.5
        total_risk_procured_mwh += risk_procure_mw * 0.5
        
        if imbalance_mw < 0:
            total_short_imbalance_mwh += abs(imbalance_mw) * 0.5
            exposure = "SHORT_DEFICIT"  # Punitive System Buy Price cashout
        elif imbalance_mw > 0:
            total_long_imbalance_mwh += imbalance_mw * 0.5
            exposure = "LONG_EXCESS"    # Depressed System Sell Price cashout
        else:
            exposure = "BALANCED"
            
        results.append({
            "settlementPeriod": sp,
            "startTime": p['startTime'],
            "consumerDemandMw": demand_mw,
            "windForecastMw": fc_wind,
            "windActualMw": act_wind,
            "baseProcurementMw": base_procure_mw,
            "riskAdjustedProcurementMw": risk_procure_mw,
            "imbalanceMw": imbalance_mw,
            "exposure": exposure
        })
        
    return {
        "deliveryDate": delivery_date,
        "parameters": {
            "peakDemandMw": peak,
            "offPeakDemandMw": offpeak,
            "riskBufferMw": buffer
        },
        "totalsMWh": {
            "totalConsumerDemandMWh": round(total_consumer_mwh, 1),
            "totalWindForecastMWh": round(total_wind_forecast_mwh, 1),
            "totalWindActualMWh": round(total_wind_actual_mwh, 1),
            "totalBaseProcuredMWh": round(total_base_procured_mwh, 1),
            "totalRiskProcuredMWh": round(total_risk_procured_mwh, 1),
            "shortDeficitExposureMWh": round(total_short_imbalance_mwh, 1),
            "longExcessExposureMWh": round(total_long_imbalance_mwh, 1)
        },
        "periods": results
    }

