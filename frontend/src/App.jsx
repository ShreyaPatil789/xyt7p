import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DateGateSelector from './components/DateGateSelector';
import MetricsCard from './components/MetricsCard';
import ForecastChart from './components/ForecastChart';
import ForecastEvolutionChart from './components/ForecastEvolutionChart';
import DailyAccuracyTable from './components/DailyAccuracyTable';
import SettlementPeriodHeatmap from './components/SettlementPeriodHeatmap';
import ProcurementCalculator from './components/ProcurementCalculator';
import PitchDeckModal from './components/PitchDeckModal';
import ArchitectureModal from './components/ArchitectureModal';
import {
  fetchAvailableDates,
  fetchDayForecast,
  fetchMonthlyAnalytics,
} from './services/api';
import { Wind, AlertCircle, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffTime, setCutoffTime] = useState('2026-01-14T11:00:00Z');
  const [dayData, setDayData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);

  // Initial load: available dates and monthly analytics
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAvailableDates(),
      fetchMonthlyAnalytics(11)
    ])
      .then(([datesRes, monthlyRes]) => {
        if (datesRes.dates && datesRes.dates.length > 0) {
          setDates(datesRes.dates);
          const defaultD = datesRes.dates.includes('2026-01-15')
            ? '2026-01-15'
            : datesRes.dates[0];
          setSelectedDate(defaultD);
          updateCutoffForDate(defaultD, 11);
        }
        setMonthlyData(monthlyRes);
      })
      .catch((err) => {
        console.error('Initialization error:', err);
        setError('Failed to connect to backend service. Please ensure the backend is running on port 8000.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to update cutoff timestamp when date changes
  const updateCutoffForDate = (dateStr, hour = 11) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() - 1);
    const dMinus1 = dateObj.toISOString().split('T')[0];
    const newCutoff = `${dMinus1}T${String(hour).padStart(2, '0')}:00:00Z`;
    setCutoffTime(newCutoff);
    return newCutoff;
  };

  // Load day forecast when date or cutoff changes
  useEffect(() => {
    if (!selectedDate) return;
    fetchDayForecast(selectedDate, cutoffTime)
      .then((data) => {
        setDayData(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Day data fetch error:', err);
        setError(`Failed to fetch forecast for ${selectedDate}`);
      });
  }, [selectedDate, cutoffTime]);

  const handleSelectDate = (newDate) => {
    setSelectedDate(newDate);
    updateCutoffForDate(newDate, 11);
  };

  const handleSelectCutoff = (newCutoff) => {
    setCutoffTime(newCutoff);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPitch={() => setIsPitchOpen(true)}
        onOpenArch={() => setIsArchOpen(true)}
        selectedDate={selectedDate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div className="flex-1">
              <span className="font-semibold">Connection Notice:</span> {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Global Key Metrics Bar */}
        {dayData && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Decision Gate Accuracy Metrics • Delivery Date: {selectedDate}
              </h2>
              <span className="text-[11px] text-slate-500">
                Evaluated against 48 Settlement Periods
              </span>
            </div>
            <MetricsCard metrics={dayData.dayMetrics} />
          </section>
        )}

        {/* Date and Gate Selector for Cockpit, Evolution, and Procurement */}
        {activeTab !== 'analytics' && (
          <DateGateSelector
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            cutoffTime={cutoffTime}
            onSelectCutoff={handleSelectCutoff}
          />
        )}

        {/* TAB 1: Day-Ahead Cockpit */}
        {activeTab === 'cockpit' && dayData && (
          <section className="space-y-6">
            <ForecastChart
              profile={dayData.profile}
              deliveryDate={selectedDate}
              decisionCutoffTime={cutoffTime}
            />

            {/* Quick summary of the month */}
            {monthlyData && (
              <DailyAccuracyTable
                dailyData={monthlyData.dailyBreakdown}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
            )}
          </section>
        )}

        {/* TAB 2: Forecast Evolution */}
        {activeTab === 'evolution' && (
          <section className="space-y-6">
            <ForecastEvolutionChart
              deliveryDate={selectedDate}
              actualProfile={dayData?.profile || []}
            />
          </section>
        )}

        {/* TAB 3: Monthly Analytics */}
        {activeTab === 'analytics' && monthlyData && (
          <section className="space-y-6">
            {/* Global January Scorecard */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>January 2026 National Wind Forecast Evaluation Suite</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aggregated across all 1,488 settlement periods in January 2026 at Day-Ahead Gate Closure (11:00 UTC D-1).
                  </p>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Full Month Complete (31 Days)
                </div>
              </div>
              <MetricsCard metrics={monthlyData.globalMetrics} />
            </div>

            {/* Diurnal Pattern & Error Distribution */}
            <SettlementPeriodHeatmap
              spProfiles={monthlyData.settlementPeriodProfiles}
              errorDistribution={monthlyData.errorDistribution}
            />

            {/* Full 31-day table */}
            <DailyAccuracyTable
              dailyData={monthlyData.dailyBreakdown}
              onSelectDate={(d) => {
                handleSelectDate(d);
                setActiveTab('cockpit');
              }}
              selectedDate={selectedDate}
            />
          </section>
        )}

        {/* TAB 4: Procurement Simulator */}
        {activeTab === 'procurement' && (
          <section className="space-y-6">
            <ProcurementCalculator
              deliveryDate={selectedDate}
              decisionCutoffTime={cutoffTime}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">AeroProcure UK</span>
            <span>• Built for UK Wholesale Day-Ahead Power Procurement</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Data Source: <strong>Elexon BMRS</strong> (FUELHH & WINDFOR streams)</span>
            <span>•</span>
            <span>Period: <strong>January 2026</strong></span>
            <span>•</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              OpenAPI Swagger Docs
            </a>
          </div>
        </div>
      </footer>

      {/* Presentation & Review Modals */}
      <PitchDeckModal isOpen={isPitchOpen} onClose={() => setIsPitchOpen(false)} />
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setIsArchOpen(false)} />
    </div>
  );
}
