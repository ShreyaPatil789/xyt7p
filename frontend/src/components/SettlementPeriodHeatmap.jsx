import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Clock, Zap, AlertCircle } from 'lucide-react';

export default function SettlementPeriodHeatmap({ spProfiles = [], errorDistribution = [] }) {
  if (!spProfiles || spProfiles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Diurnal Settlement Period Profiling */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Diurnal Error Pattern by Settlement Period (SP 1 - 48)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Average Day-Ahead MAE and Directional Bias across 30-minute settlement periods in January 2026.
          </p>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={spProfiles} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="settlementPeriod"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(sp) => (sp % 4 === 1 ? `SP${sp}` : '')}
                stroke="#334155"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(v) => `${v} MW`}
                stroke="#334155"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={(val, name) => [`${val} MW`, name]}
                labelFormatter={(sp) => {
                  const p = spProfiles.find((x) => x.settlementPeriod === sp);
                  return `Settlement Period ${sp} (${p?.timeLabel} UTC)${p?.isPeak ? ' - UK PEAK DEMAND' : ''}`;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              <Bar dataKey="mae" name="Mean Absolute Error (MAE, MW)" fill="#38bdf8" radius={[2, 2, 0, 0]} />
              <Line
                type="monotone"
                dataKey="bias"
                name="Directional Bias (MW)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Peak Demand Exposure (SPs 33-38 • 16:30 - 19:00 UTC)</span>
          </div>
          Forecast errors during evening peak carry 3x to 5x higher financial risk because UK wholesale power spot and System Buy Prices (cashout) surge during these peak hours.
        </div>
      </div>

      {/* Error Distribution Histogram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>Forecast Error Distribution Histogram</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Frequency of Day-Ahead forecast errors (Forecast - Actual, MW) across all settlement periods.
          </p>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="bin"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
                stroke="#334155"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#334155" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={(val) => [`${val} periods`, 'Frequency']}
                labelFormatter={(bin) => `Error Bin ~ ${bin} MW`}
              />
              <ReferenceLine x={0} stroke="#10b981" strokeDasharray="2 2" />
              <Bar dataKey="count" name="Settlement Periods Count" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="font-semibold text-slate-300">Statistical Interpretation:</span> A near-symmetric bell distribution centered around 0 indicates unbiased forecasts. Any noticeable skew to the right indicates persistent over-forecasting, while fat tails represent extreme ramp events or storm-tracking uncertainty.
        </div>
      </div>
    </div>
  );
}
