import React from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Info, Filter } from 'lucide-react';

export default function DateGateSelector({
  dates = [],
  selectedDate,
  onSelectDate,
  cutoffTime,
  onSelectCutoff,
}) {
  const currentIndex = dates.indexOf(selectedDate);

  const handlePrevDay = () => {
    if (currentIndex > 0) {
      onSelectDate(dates[currentIndex - 1]);
    }
  };

  const handleNextDay = () => {
    if (currentIndex < dates.length - 1) {
      onSelectDate(dates[currentIndex + 1]);
    }
  };

  // Preset cutoffs relative to selectedDate
  const getCutoffPresets = () => {
    if (!selectedDate) return [];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    
    // D-1
    const dMinus1 = new Date(dateObj);
    dMinus1.setUTCDate(dMinus1.getUTCDate() - 1);
    const d1Str = dMinus1.toISOString().split('T')[0];

    // D-2
    const dMinus2 = new Date(dateObj);
    dMinus2.setUTCDate(dMinus2.getUTCDate() - 2);
    const d2Str = dMinus2.toISOString().split('T')[0];

    return [
      {
        id: 'd1_11',
        label: 'D-1 11:00 UTC (UK Auction Gate)',
        iso: `${d1Str}T11:00:00Z`,
        badge: 'Standard Day-Ahead Gate',
      },
      {
        id: 'd1_07',
        label: 'D-1 07:00 UTC (Desk Morning Brief)',
        iso: `${d1Str}T07:00:00Z`,
        badge: 'Early Look',
      },
      {
        id: 'd1_17',
        label: 'D-1 17:00 UTC (Afternoon Rebalance)',
        iso: `${d1Str}T17:00:00Z`,
        badge: 'Post-Auction Update',
      },
      {
        id: 'd2_12',
        label: 'D-2 12:00 UTC (48h Preliminary)',
        iso: `${d2Str}T12:00:00Z`,
        badge: 'Medium-Term',
      },
    ];
  };

  const presets = getCutoffPresets();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Delivery Date:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevDay}
              disabled={currentIndex <= 0}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d} {d === '2026-01-15' ? '(Mid-Month Benchmark)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextDay}
              disabled={currentIndex >= dates.length - 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gate Cutoff Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Decision Cutoff:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const isSelected = cutoffTime === p.iso;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectCutoff(p.iso)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200 border border-slate-750'
                  }`}
                  title={`Use latest forecasts published on or before ${p.iso}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decision Context Callout */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">UK Market Gate Context:</span> In the UK Day-Ahead wholesale market (Nord Pool / EPEX SPOT), traders place purchase orders one day prior (D-1) before the 11:00 UTC auction cutoff. The profile below reflects <strong className="text-emerald-400">only forecasts published on or before {cutoffTime || 'D-1 11:00 UTC'}</strong>, preventing lookahead bias.
        </div>
      </div>
    </div>
  );
}

