import React from 'react';
import { X, Layers, Code, Database, Server, Cpu, CheckCircle2 } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Deliverable 3.2 • Part 2 Tech Lead Review (5-min Guide)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Software Architecture, Data Pipeline & Key Engineering Practices
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Minute Technical Review Script */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-xs">
            Recommended 5-Minute Tech Lead Review Agenda:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">1</span>
                Minute 0:00 - 1:00: Architecture & Technology Stack
              </div>
              <p className="text-slate-400">
                FastAPI Python backend + React 18 frontend (Vite, Tailwind, Recharts). Decoupled RESTful API with automated OpenAPI specifications (<code className="text-sky-300">/docs</code>). Containerized with multi-stage Docker and Docker Compose.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">2</span>
                Minute 1:00 - 2:15: Data Ingestion & Gate Query Engine
              </div>
              <p className="text-slate-400">
                Direct stream ingestion from Elexon BMRS (<code className="text-emerald-300">FUELHH</code> wind actuals and <code className="text-emerald-300">WINDFOR</code> forecasts). Explain SQL window query using <code className="text-emerald-300">ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC)</code> to isolate latest forecast prior to cutoff.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px]">3</span>
                Minute 2:15 - 3:30: Quantitative Analytics Engine
              </div>
              <p className="text-slate-400">
                Vectorized NumPy/SciPy computation of MAE, RMSE, WAPE (volume-weighted), Directional Bias, NMAE against UK wind capacity (~30 GW), and empirical error percentiles (P10, P50, P90).
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
                Minute 3:30 - 5:00: Code Quality, Testing & Production Readiness
              </div>
              <p className="text-slate-400">
                Unit test suite covering data matching, metrics accuracy, and edge cases. SQLite indexed storage for sub-millisecond responses with live sync fallback. Clean directory layout and environment variable configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Architecture Diagram */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            End-to-End System Architecture & Data Flow
          </h4>
          <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`+-----------------------------------------------------------------------------------+
|                        ELEXON BMRS CLOUD API (UK)                                 |
|  * FUELHH Stream (Half-Hourly Actuals)  * WINDFOR Stream (Published Forecasts)    |
+-----------------------------------------------------------------------------------+
                                         │
                         (Ingestion & Periodic Sync)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        PYTHON FASTAPI BACKEND SERVICE                             |
|  * Data Layer: SQLite Cache (elexon_jan2026.db) with start_time & publish_time idx|
|  * Decision Cutoff Engine: Window functions isolating forecast at D-1 11:00 UTC   |
|  * Quantitative Suite: NumPy vectorized MAE, RMSE, WAPE, Bias, Empirical P10-P90  |
|  * Procurement Simulator: Net thermal residual demand & imbalance risk calculator |
+-----------------------------------------------------------------------------------+
                                         │
                                  (RESTful JSON)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        REACT 18 SINGLE-PAGE APPLICATION                           |
|  * Interactive Day-Ahead Cockpit (48 settlement periods, zoom, error bars)        |
|  * Forecast Evolution Explorer (D-2, D-1 morning, auction gate, D-0 intraday)     |
|  * Monthly Performance Scorecards & Diurnal SP 1-48 Heatmap                       |
|  * Live Power Procurement & Imbalance Simulator                                   |
+-----------------------------------------------------------------------------------+`}
          </div>
        </div>

        {/* Engineering Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Vectorized NumPy Computations</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Fast vectorization across 1,488 January settlement periods ensures sub-millisecond metric updates.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Containerized & Cloud Ready</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Multi-stage Docker build ready for single-command deployment on Docker, Heroku, or Vercel.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automated Unit Testing</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Comprehensive test suite verifies database schema, statistical functions, and Elexon integration.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
          >
            Close & Review Codebase
          </button>
        </div>
      </div>
    </div>
  );
}
