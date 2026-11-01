import React, { useState, useEffect } from 'react';
import { simulateProcurement } from '../services/api';
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
import { ShieldCheck, Sliders, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function ProcurementCalculator({ deliveryDate, decisionCutoffTime }) {
  const [peakDemand, setPeakDemand] = useState(34000);
  const [offPeakDemand, setOffPeakDemand] = useState(22000);
  const [riskBuffer, setRiskBuffer] = useState(1500);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    if (!deliveryDate) return;
    setLoading(true);
    simulateProcurement({
      deliveryDate,
      cutoffTimeIso: decisionCutoffTime,
      peakDemandMw: Number(peakDemand),
      offPeakDemandMw: Number(offPeakDemand),
      riskBufferMw: Number(riskBuffer),
    })
      .then((data) => setSimulation(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSimulation();
  }, [deliveryDate, decisionCutoffTime]);

  if (!simulation && loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Simulating day-ahead power procurement...
      </div>
    );
  }

  const totals = simulation?.totalsMWh || {};
  const periods = simulation?.periods || [];

  const chartData = periods.map((p) => ({
    sp: p.settlementPeriod,
    time: p.startTime ? p.startTime.substring(11, 16) : `SP${p.settlementPeriod}`,
    demand: p.consumerDemandMw,
    windForecast: p.windForecastMw,
    windActual: p.windActualMw,
    netThermalProcure: p.baseProcurementMw,
    riskAdjustedProcure: p.riskAdjustedProcurementMw,
    imbalance: p.imbalanceMw,
    shortImbalance: p.imbalanceMw < 0 ? Math.abs(p.imbalanceMw) : 0,
    longImbalance: p.imbalanceMw > 0 ? p.imbalanceMw : 0,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Day-Ahead Power Procurement & Imbalance Exposure Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Determining net market / thermal power to buy on the Day-Ahead auction (Demand - Wind Forecast) for <span className="text-white font-medium">{deliveryDate}</span>.
          </p>
        </div>

        {/* Sliders for demand and buffer */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Peak Demand:</span>
            <input
              type="number"
              step="1000"
              value={peakDemand}
              onChange={(e) => setPeakDemand(e.target.value)}
              className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500">MW</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Off-Peak:</span>
            <input
              type="number"
              step="1000"
              value={offPeakDemand}
              onChange={(e) => setOffPeakDemand(e.target.value)}
              className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500">MW</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Risk Buffer:</span>
            <input
              type="number"
              step="250"
              value={riskBuffer}
              onChange={(e) => setRiskBuffer(e.target.value)}
              className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
            <span className="text-slate-500">MW</span>
          </div>

          <button
            onClick={runSimulation}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Update Simulation
          </button>
        </div>
      </div>

      {/* Procurement KPI Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <p className="text-[11px] text-slate-400">Total Consumer Demand</p>
          <p className="text-base font-bold text-white mt-1">
            {totals.totalConsumerDemandMWh?.toLocaleString()} MWh
          </p>
          <p className="text-[10px] text-slate-500">24-hour daily demand energy</p>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <p className="text-[11px] text-emerald-400">Expected Wind Generation</p>
          <p className="text-base font-bold text-emerald-400 mt-1">
            {totals.totalWindForecastMWh?.toLocaleString()} MWh
          </p>
          <p className="text-[10px] text-slate-500">
            Actual: {totals.totalWindActualMWh?.toLocaleString()} MWh
          </p>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <p className="text-[11px] text-purple-400">Net Thermal / Market Procurement</p>
          <p className="text-base font-bold text-purple-300 mt-1">
            {totals.totalBaseProcuredMWh?.toLocaleString()} MWh
          </p>
          <p className="text-[10px] text-slate-500">Day-Ahead Auction Target</p>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <p className="text-[11px] text-amber-400">Risk-Adjusted Procurement</p>
          <p className="text-base font-bold text-amber-300 mt-1">
            {totals.totalRiskProcuredMWh?.toLocaleString()} MWh
          </p>
          <p className="text-[10px] text-slate-500">Hedged with +{riskBuffer} MW buffer</p>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-[11px] text-rose-400">Balancing Cashout Exposure</p>
          <p className="text-base font-bold text-rose-300 mt-1">
            {totals.shortDeficitExposureMWh?.toLocaleString()} MWh Short
          </p>
          <p className="text-[10px] text-cyan-400">
            {totals.longExcessExposureMWh?.toLocaleString()} MWh Long
          </p>
        </div>
      </div>

      {/* Main Procurement Profile Chart */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="thermalProcureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
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
              labelFormatter={(sp) => `Settlement Period ${sp}`}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {/* Total Consumer Demand to meet */}
            <Line
              type="monotone"
              dataKey="demand"
              name="Consumer Demand (MW)"
              stroke="#f1f5f9"
              strokeWidth={2}
              dot={false}
            />

            {/* Wind Forecast */}
            <Line
              type="monotone"
              dataKey="windForecast"
              name="Wind Power Forecast (WINDFOR, MW)"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Net Day-Ahead Procurement Need */}
            <Area
              type="monotone"
              dataKey="netThermalProcure"
              name="Net Day-Ahead Procurement Need (MW)"
              stroke="#818cf8"
              strokeWidth={2.5}
              fill="url(#thermalProcureGrad)"
            />

            {/* Risk Adjusted Procurement */}
            <Line
              type="monotone"
              dataKey="riskAdjustedProcure"
              name="Risk-Adjusted Procurement (MW)"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Commercial Day-Ahead Trading Strategy
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            By subtracting the latest Elexon wind forecast from consumer demand, the trading desk directly determines the exact MW purchase volume required for each half-hour contract on the EPEX SPOT / Nord Pool UK auction.
          </p>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Quantified Error & Safety Buffer
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Applying a {riskBuffer} MW buffer mitigates the risk of sudden wind under-generation during peak periods, protecting the utility from punitive cashout penalties (System Buy Price) when market liquidity is scarce.
          </p>
        </div>
      </div>
    </div>
  );
}
