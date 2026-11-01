import React from 'react';
import { X, CheckCircle, Zap, ShieldAlert, Award, Clock, ArrowRight } from 'lucide-react';

export default function PitchDeckModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Deliverable 3.1 • Part 1 Client Pitch (5-min Guide)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Client Pitch: AeroProcure UK for Power Procurement Desk
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 p-4 rounded-xl border border-emerald-500/20 space-y-2">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Executive Value Proposition
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            "Every day at 11:00 AM GMT, your trading desk must commit millions of pounds on the UK Day-Ahead electricity auction to serve consumer demand. Wind generation is your single biggest volatility driver. <strong>AeroProcure UK</strong> delivers decision-grade clarity: we isolate the exact forecast published before your auction gate, quantify forecast error down to the half-hour settlement period, and calculate your optimal net thermal procurement and cashout exposure."
          </p>
        </div>

        {/* 5-Minute Pitch Structure for Video */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-xs">
            Recommended 5-Minute Video Pitch Walkthrough:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">1</span>
                Minute 0:00 - 1:00: Problem & UK Market Gate Context
              </div>
              <p className="text-slate-400">
                Explain the day-ahead wholesale procurement reality: GB Day-Ahead auction cutoff (11:00 UTC D-1). Show how the portal locks in <strong>only the latest forecasts published prior to gate closure</strong> to avoid costly lookahead bias.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">2</span>
                Minute 1:00 - 2:30: Live Cockpit & Settlement Periods
              </div>
              <p className="text-slate-400">
                Demonstrate the 48 settlement periods. Toggle between the combined curve and the error delta bars. Point out the exact error in MW and show how under/over-forecasting impacts real-time balance.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px]">3</span>
                Minute 2:30 - 3:45: Quantitative Error Evaluation Suite
              </div>
              <p className="text-slate-400">
                Navigate to the Monthly Accuracy tab. Show MAE, RMSE, WAPE, and Directional Bias. Highlight the <strong>diurnal heatmap showing higher forecast uncertainty during the lucrative evening peak (SPs 33-38)</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
                Minute 3:45 - 5:00: Procurement & Imbalance Simulator
              </div>
              <p className="text-slate-400">
                Show the commercial payoff: simulate consumer demand (34 GW peak) minus wind forecast, determine required day-ahead thermal procurement, and illustrate how a quantified safety buffer saves punitive cashout charges.
              </p>
            </div>
          </div>
        </div>

        {/* Quantified Benefits Grid */}
        <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-emerald-400 font-bold">Zero Lookahead Bias</span>
            <p className="text-slate-400 text-[11px] mt-1">
              Strict gate-closure indexing ensures you see the exact market information state at decision time.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-sky-400 font-bold">Rigorous Error Metrics</span>
            <p className="text-slate-400 text-[11px] mt-1">
              MAE, RMSE, WAPE, and Bias percentiles provide quantitative risk limits for power traders.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-amber-400 font-bold">Direct Procurement ROI</span>
            <p className="text-slate-400 text-[11px] mt-1">
              Translates MW forecast variance into tangible MWh imbalance exposure and day-ahead bidding volumes.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
          >
            Close & Start Presentation
          </button>
        </div>
      </div>
    </div>
  );
}

