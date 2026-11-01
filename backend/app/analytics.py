import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.data_store import get_available_dates, get_matched_day_profile, get_forecasts_for_cutoff
from app.config import DEFAULT_WIND_INSTALLED_CAPACITY_MW

def compute_metrics(errors: List[float], actuals: List[float], forecasts: List[float]) -> Dict[str, Any]:
    """
    Computes rigorous energy quantitative forecast evaluation metrics:
    MAE, RMSE, MAPE, WAPE, Bias, NMAE, Percentiles, Correlation.
    """
    if not errors or len(errors) == 0:
        return {
            "count": 0,
            "mae": 0.0,
            "rmse": 0.0,
            "mape": 0.0,
            "wape": 0.0,
            "bias": 0.0,
            "nmae": 0.0,
            "maxOverForecast": 0.0,
            "maxUnderForecast": 0.0,
            "p10": 0.0,
            "p50": 0.0,
            "p90": 0.0,
            "overForecastFrequency": 0.0,
            "underForecastFrequency": 0.0,
            "r2": 0.0
        }
        
    err_arr = np.array(errors, dtype=float)
    act_arr = np.array(actuals, dtype=float)
    fc_arr = np.array(forecasts, dtype=float)
    
    n = len(err_arr)
    abs_errors = np.abs(err_arr)
    
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(err_arr ** 2)))
    bias = float(np.mean(err_arr))
    
    # WAPE = sum(|F - A|) / sum(A) * 100
    sum_act = float(np.sum(act_arr))
    wape = float((np.sum(abs_errors) / sum_act * 100.0)) if sum_act > 0 else 0.0
    
    # MAPE with threshold to prevent division by zero (< 50 MW)
    valid_mask = act_arr > 50.0
    if np.any(valid_mask):
        mape = float(np.mean(abs_errors[valid_mask] / act_arr[valid_mask]) * 100.0)
    else:
        mape = wape
        
    # Normalized MAE against estimated installed capacity (~30,000 MW)
    nmae = float((mae / DEFAULT_WIND_INSTALLED_CAPACITY_MW) * 100.0)
    
    # Quantiles
    p10 = float(np.percentile(err_arr, 10))
    p50 = float(np.percentile(err_arr, 50))
    p90 = float(np.percentile(err_arr, 90))
    
    # Directional probabilities
    over_count = int(np.sum(err_arr > 20.0))
    under_count = int(np.sum(err_arr < -20.0))
    over_freq = round((over_count / n) * 100.0, 1)
    under_freq = round((under_count / n) * 100.0, 1)
    
    # Pearson R^2 correlation
    if np.std(act_arr) > 0 and np.std(fc_arr) > 0:
        corr_matrix = np.corrcoef(act_arr, fc_arr)
        r2 = float(corr_matrix[0, 1] ** 2)
    else:
        r2 = 0.0
        
    return {
        "count": n,
        "mae": round(mae, 1),
        "rmse": round(rmse, 1),
        "mape": round(mape, 2),
        "wape": round(wape, 2),
        "bias": round(bias, 1),
        "nmae": round(nmae, 2),
        "maxOverForecast": round(float(np.max(err_arr)), 1),
        "maxUnderForecast": round(float(np.min(err_arr)), 1),
        "p10": round(p10, 1),
        "p50": round(p50, 1),
        "p90": round(p90, 1),
        "overForecastFrequency": over_freq,
        "underForecastFrequency": under_freq,
        "r2": round(r2, 4)
    }

def get_monthly_analytics_summary(cutoff_hour: int = 11) -> Dict[str, Any]:
    """
    Computes global statistics, daily scorecard breakdown, and settlement period
    diurnal profiles for all of January 2026.
    """
    dates = get_available_dates()
    
    all_errors = []
    all_actuals = []
    all_forecasts = []
    
    daily_records = []
    sp_accumulators = {sp: {"errors": [], "actuals": [], "forecasts": []} for sp in range(1, 49)}
    
    for d in dates:
        dt = datetime.strptime(d, "%Y-%m-%d")
        d_minus_1 = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
        cutoff_iso = f"{d_minus_1}T{cutoff_hour:02d}:00:00Z"
        
        profile = get_matched_day_profile(d, cutoff_iso)
        day_errs = [p['error'] for p in profile if p['error'] is not None]
        day_acts = [p['actualGeneration'] for p in profile if p['error'] is not None]
        day_fcs = [p['forecastGeneration'] for p in profile if p['error'] is not None]
        
        if day_errs:
            all_errors.extend(day_errs)
            all_actuals.extend(day_acts)
            all_forecasts.extend(day_fcs)
            
            day_metrics = compute_metrics(day_errs, day_acts, day_fcs)
            daily_records.append({
                "date": d,
                "meanActual": round(float(np.mean(day_acts)), 1),
                "meanForecast": round(float(np.mean(day_fcs)), 1),
                "mae": day_metrics['mae'],
                "rmse": day_metrics['rmse'],
                "wape": day_metrics['wape'],
                "bias": day_metrics['bias'],
                "maxOverForecast": day_metrics['maxOverForecast'],
                "maxUnderForecast": day_metrics['maxUnderForecast']
            })
            
            for p in profile:
                sp = p['settlementPeriod']
                if sp in sp_accumulators and p['error'] is not None:
                    sp_accumulators[sp]['errors'].append(p['error'])
                    sp_accumulators[sp]['actuals'].append(p['actualGeneration'])
                    sp_accumulators[sp]['forecasts'].append(p['forecastGeneration'])
                    
    # Global monthly metrics
    global_metrics = compute_metrics(all_errors, all_actuals, all_forecasts)
    
    # Settlement Period profiling (SPs 1 to 48)
    sp_profiles = []
    for sp in range(1, 49):
        sp_data = sp_accumulators[sp]
        sp_errs = sp_data['errors']
        sp_acts = sp_data['actuals']
        sp_fcs = sp_data['forecasts']
        
        if sp_errs:
            sp_metrics = compute_metrics(sp_errs, sp_acts, sp_fcs)
            # Map settlement period to approximate time (e.g. SP 1 is 00:00, SP 48 is 23:30)
            hour = (sp - 1) // 2
            minute = 30 if (sp % 2 == 0) else 0
            time_label = f"{hour:02d}:{minute:02d}"
            
            is_peak = (16 <= sp <= 20) or (33 <= sp <= 38) # Morning and Evening peaks in UK
            sp_profiles.append({
                "settlementPeriod": sp,
                "timeLabel": time_label,
                "isPeak": is_peak,
                "meanActual": round(float(np.mean(sp_acts)), 1),
                "meanForecast": round(float(np.mean(sp_fcs)), 1),
                "mae": sp_metrics['mae'],
                "rmse": sp_metrics['rmse'],
                "wape": sp_metrics['wape'],
                "bias": sp_metrics['bias'],
                "p10": sp_metrics['p10'],
                "p90": sp_metrics['p90']
            })
            
    # Histogram distribution of errors
    hist, bin_edges = np.histogram(all_errors, bins=25)
    distribution = []
    for i in range(len(hist)):
        bin_center = round((bin_edges[i] + bin_edges[i+1]) / 2.0, 0)
        distribution.append({
            "bin": int(bin_center),
            "range": f"{int(bin_edges[i])} to {int(bin_edges[i+1])} MW",
            "count": int(hist[i])
        })
        
    return {
        "month": "January 2026",
        "cutoffHour": cutoff_hour,
        "globalMetrics": global_metrics,
        "dailyBreakdown": daily_records,
        "settlementPeriodProfiles": sp_profiles,
        "errorDistribution": distribution
    }

def get_lead_time_sensitivity(sample_date: str = "2026-01-15") -> List[Dict[str, Any]]:
    """
    Compares forecast accuracy degradation across different forecast horizons / lead times:
    48h ahead (D-2 11:00), 36h ahead (D-2 23:00), 24h ahead (D-1 11:00 Gate), 16h ahead (D-1 19:00), 6h ahead (D-0 06:00).
    """
    dt = datetime.strptime(sample_date, "%Y-%m-%d")
    horizons = [
        {"label": "48h Ahead (D-2 Noon)", "iso": f"{(dt - timedelta(days=2)).strftime('%Y-%m-%d')}T12:00:00Z", "leadHours": 48},
        {"label": "36h Ahead (D-2 Midnight)", "iso": f"{(dt - timedelta(days=2)).strftime('%Y-%m-%d')}T23:00:00Z", "leadHours": 36},
        {"label": "24h Ahead (D-1 Auction Gate)", "iso": f"{(dt - timedelta(days=1)).strftime('%Y-%m-%d')}T11:00:00Z", "leadHours": 24},
        {"label": "16h Ahead (D-1 Evening)", "iso": f"{(dt - timedelta(days=1)).strftime('%Y-%m-%d')}T19:00:00Z", "leadHours": 16},
        {"label": "6h Ahead (Intraday Morning)", "iso": f"{sample_date}T06:00:00Z", "leadHours": 6},
    ]
    
    results = []
    for h in horizons:
        profile = get_matched_day_profile(sample_date, h["iso"])
        errs = [p['error'] for p in profile if p['error'] is not None]
        acts = [p['actualGeneration'] for p in profile if p['error'] is not None]
        fcs = [p['forecastGeneration'] for p in profile if p['error'] is not None]
        metrics = compute_metrics(errs, acts, fcs)
        results.append({
            "horizon": h["label"],
            "leadHours": h["leadHours"],
            "cutoffIso": h["iso"],
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "wape": metrics["wape"],
            "bias": metrics["bias"]
        })
    return results
