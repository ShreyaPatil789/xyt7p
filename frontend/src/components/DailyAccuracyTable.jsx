import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

export default function DailyAccuracyTable({ dailyData = [], onSelectDate, selectedDate }) {
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  if (!dailyData || dailyData.length === 0) return null;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedData = [...dailyData].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const getDayStatusBadge = (wape, bias) => {
    if (wape < 8.0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          High Precision
        </span>
      );
    } else if (wape > 20.0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          High Volatility
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        Normal Range
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Daily Forecast Performance Leaderboard • January 2026
          </h3>
          <p className="text-xs text-slate-400">
            Click any row to inspect the full 48 settlement periods and procurement decisions for that delivery day.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{sortedData.length}</span> Delivery Days
        </div>
      </div>

      <div className="overflow-x-auto max-h-[420px] rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-300 sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Delivery Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('meanActual')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Mean Actual (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('meanForecast')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Mean Forecast (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('mae')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>MAE (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('wape')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>WAPE (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('bias')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Bias (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold">Status / Regime</th>
              <th className="py-2.5 px-3 font-semibold text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
            {sortedData.map((row) => {
              const isSelected = row.date === selectedDate;
              return (
                <tr
                  key={row.date}
                  onClick={() => onSelectDate(row.date)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {row.date}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">
                    {row.meanActual.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-sky-400">
                    {row.meanForecast.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {row.mae.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-semibold ${
                        row.wape < 10
                          ? 'text-emerald-400'
                          : row.wape > 20
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {row.wape}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={row.bias > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                      {row.bias > 0 ? `+${row.bias.toLocaleString()}` : row.bias.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {getDayStatusBadge(row.wape, row.bias)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(row.date);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Load Day Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
