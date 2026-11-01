const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchAvailableDates() {
  const res = await fetch(`${API_BASE}/api/forecasts/dates`);
  if (!res.ok) throw new Error('Failed to fetch available dates');
  return res.json();
}

export async function fetchDayForecast(date, cutoffTime = null) {
  let url = `${API_BASE}/api/forecasts/day?date=${encodeURIComponent(date)}`;
  if (cutoffTime) {
    url += `&cutoff_time=${encodeURIComponent(cutoffTime)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch forecast for date ${date}`);
  return res.json();
}

export async function fetchForecastEvolution(date) {
  const res = await fetch(`${API_BASE}/api/forecasts/evolution?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(`Failed to fetch evolution for date ${date}`);
  return res.json();
}

export async function fetchMonthlyAnalytics(cutoffHour = 11) {
  const res = await fetch(`${API_BASE}/api/analytics/monthly-summary?cutoff_hour=${cutoffHour}`);
  if (!res.ok) throw new Error('Failed to fetch monthly analytics');
  return res.json();
}

export async function fetchLeadTimeCurve(sampleDate = '2026-01-15') {
  const res = await fetch(`${API_BASE}/api/analytics/lead-time-curve?sample_date=${encodeURIComponent(sampleDate)}`);
  if (!res.ok) throw new Error('Failed to fetch lead time curve');
  return res.json();
}

export async function simulateProcurement(params) {
  const res = await fetch(`${API_BASE}/api/procurement/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to simulate procurement');
  return res.json();
}

