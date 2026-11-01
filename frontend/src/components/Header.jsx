import React from 'react';
import { Wind, Activity, BookOpen, Layers, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenPitch,
  onOpenArch,
  selectedDate
}) {
  const tabs = [
    { id: 'cockpit', label: 'Day-Ahead Cockpit', icon: Activity },
    { id: 'evolution', label: 'Forecast Evolution', icon: Clock },
    { id: 'analytics', label: 'Monthly Accuracy (Jan 2026)', icon: Zap },
    { id: 'procurement', label: 'Procurement & Imbalance Risk', icon: ShieldCheck },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wind className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  AeroProcure UK
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  GB Wholesale Market
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Day-Ahead Wind Power Forecast Intelligence • Elexon BMRS Live Integration
              </p>
            </div>
          </div>

          {/* Action buttons for Client Pitch & Tech Review */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenPitch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
              title="View Client Pitch & Presentation Script (Deliverable 3.1)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Client Pitch</span> (Part 1)
            </button>
            <button
              onClick={onOpenArch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition-all shadow-sm"
              title="View Technical Lead Architecture & Code Review (Deliverable 3.2)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tech Review</span> (Part 2)
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
