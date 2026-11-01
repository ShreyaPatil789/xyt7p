import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { fetchForecastEvolution } from '../services/api';
import { Clock, TrendingUp, Info } from 'lucide-react';

export default function ForecastEvolutionChart({ deliveryDate, actualProfile = [] }) {
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliveryDate) return;
    setLoading(true);
    fetchForecastEvolution(deliveryDate)
      .then((data) => setEvolutionData(data.evolution))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [deliveryDate]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Loading forecast evolution curves...
      </div>
    );
  }

  if (!evolutionData) return null;

  // Build merged hourly series from 00:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  const chartData = hours.map((hour) => {
    const fullIso = `${deliveryDate}T${hour}:00Z`;
    const row = { hour };

    // Actual generation at this hour (if present)
    const matchedActual = actualProfile.find((p) => p.startTime === fullIso);
    if (matchedActual) {
      row.actual = matchedActual.actualGeneration;
    }

    // Horizon forecast values
    Object.entries(evolutionData).forEach(([horizonLabel, horizonObj]) => {
      const match = horizonObj.forecasts?.find((f) => f.start_time === fullIso);
      row[horizonLabel] = match ? match.generation : null;
    });

    return row;
  });

  const horizonColors = {
    'D-2 (48h Lead)': '#a855f7', // purple
    'D-1 Early Morning (07:00)': '#f59e0b', // amber
    'D-1 Auction Gate (11:00)': '#38bdf8', // sky blue (primary)
    'D-1 Evening (17:00)': '#3b82f6', // blue
    'D-0 Intraday (06:00)': '#e879f9', // fuchsia
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Forecast Evolution & Lead-Time Convergence</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Observing how National Grid ESO forecasts shifted from 48 hours out (D-2) to Intraday (D-0) for delivery on <span className="text-white font-medium">{deliveryDate}</span>.
          </p>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)} GW`}
              stroke="#334155"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(val, name) => [`${val?.toLocaleString()} MW`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {/* Actual realized wind */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Realized Wind Actual (FUELHH)"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 3, fill: '#10b981' }}
            />

            {/* Horizon lines */}
            {Object.keys(evolutionData).map((horizonKey) => (
              <Line
                key={horizonKey}
                type="monotone"
                dataKey={horizonKey}
                name={horizonKey}
                stroke={horizonColors[horizonKey] || '#94a3b8'}
                strokeWidth={horizonKey.includes('11:00') ? 2.5 : 1.5}
                strokeDasharray={horizonKey.includes('11:00') ? '4 4' : '2 2'}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
        <span className="font-semibold text-slate-300">Trader Takeaway:</span> In wholesale power trading, forecast convergence (lines clustering together) signifies stable weather predictability, permitting tighter procurement margins. Large divergences between D-2 and D-1 11:00 indicate rapid frontal weather shifts, requiring wider risk buffers.
      </div>
    </div>
  );
}

