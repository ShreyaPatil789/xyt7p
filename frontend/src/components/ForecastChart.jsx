import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Eye, ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react';

export default function ForecastChart({ profile = [], deliveryDate, decisionCutoffTime }) {
  const [viewMode, setViewMode] = useState('combined'); // 'combined', 'delta', 'actualOnly'

  if (!profile || profile.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No settlement profile data available.
      </div>
    );
  }

  // Format chart data
  const chartData = profile.map((p) => {
    const timeStr = p.startTime ? p.startTime.substring(11, 16) : `SP ${p.settlementPeriod}`;
    return {
      sp: p.settlementPeriod,
      time: timeStr,
      label: `SP${p.settlementPeriod} (${timeStr})`,
      actual: p.actualGeneration,
      forecast: p.forecastGeneration,
      error: p.error,
      absError: p.absError,
      pctError: p.pctError,
      direction: p.direction,
      overForecastError: p.error > 0 ? p.error : 0,
      underForecastError: p.error < 0 ? p.error : 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur text-xs space-y-1.5 z-50">
          <p className="font-bold text-white border-b border-slate-800 pb-1">
            Settlement Period {data.sp} • {data.time} UTC
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 font-medium">Actual Wind Generation:</span>
            <span className="font-mono font-bold text-white">{data.actual?.toLocaleString()} MW</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sky-400 font-medium">Day-Ahead Forecast:</span>
            <span className="font-mono font-bold text-white">{data.forecast?.toLocaleString()} MW</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1">
            <span className="text-slate-400">Forecast Error (F - A):</span>
            <span className={`font-mono font-bold ${data.error > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error?.toLocaleString()} MW
            </span>
          </div>
          {data.pctError !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Relative Error:</span>
              <span className="font-mono text-slate-300">{data.pctError}%</span>
            </div>
          )}
          <div className="pt-1 text-[10px] text-slate-400 italic">
            {data.error > 50
              ? 'Over-forecast: System buy penalty exposure'
              : data.error < -50
              ? 'Under-forecast: Thermal over-procurement spill'
              : 'Within close tolerance margin'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Day-Ahead Forecast vs Realized Generation Profile</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              48 Settlement Periods (Half-Hourly)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Delivery Date: <span className="text-white font-medium">{deliveryDate}</span> • Decision Cutoff: <span className="text-sky-400 font-mono">{decisionCutoffTime}</span>
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'combined'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Combined Curves
          </button>
          <button
            onClick={() => setViewMode('delta')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'delta'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delta & Errors (MW)
          </button>
        </div>
      </div>

      {/* Recharts chart */}
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'combined' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="sp"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(sp) => (sp % 4 === 1 ? `SP${sp}` : '')}
                stroke="#334155"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)} GW`}
                stroke="#334155"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Wind Generation (FUELHH, MW)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actualGradient)"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Latest Day-Ahead Forecast (WINDFOR, MW)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: '#38bdf8' }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="sp"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(sp) => (sp % 4 === 1 ? `SP${sp}` : '')}
                stroke="#334155"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${val} MW`}
                stroke="#334155"
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="overForecastError"
                name="Over-forecast Error (MW, Shortfall Risk)"
                fill="#f59e0b"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="underForecastError"
                name="Under-forecast Error (MW, Excess Spill Risk)"
                fill="#06b6d4"
                radius={[0, 0, 3, 3]}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Period Details Footnote */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Actual Generation (FUELHH)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            Day-Ahead Forecast (WINDFOR)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Over-forecast (Shortfall)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Under-forecast (Excess)
          </span>
        </div>
        <div className="text-slate-500 italic">
          GB National Level Wind Power • 30-min Settlement Periods (SP 1 = 00:00 UTC)
        </div>
      </div>
    </div>
  );
}

