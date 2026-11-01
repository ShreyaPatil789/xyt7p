import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3, HelpCircle } from 'lucide-react';

export default function MetricsCard({ metrics, title = "Evaluation Metrics" }) {
  if (!metrics) return null;

  const cards = [
    {
      label: "MAE (Mean Absolute Error)",
      value: `${metrics.mae.toLocaleString()} MW`,
      subtext: `Normalized: ${metrics.nmae || (metrics.mae / 300).toFixed(1)}% capacity`,
      desc: "Average absolute difference between day-ahead forecast and actual wind generation across all settlement periods.",
      badge: "Accuracy",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      label: "RMSE (Root Mean Square)",
      value: `${metrics.rmse.toLocaleString()} MW`,
      subtext: "Penalizes large outlier errors",
      desc: "Heavily weights large forecast errors that cause extreme market imbalance spikes during tight grid hours.",
      badge: "Risk Sensitivity",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    {
      label: "WAPE (Weighted % Error)",
      value: `${metrics.wape}%`,
      subtext: `MAPE: ${metrics.mape}%`,
      desc: "Volume-weighted absolute error. Unlike raw MAPE, WAPE does not artificially explode during low wind periods.",
      badge: "Industry Standard",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      label: "Forecast Bias (Mean Error)",
      value: `${metrics.bias > 0 ? '+' : ''}${metrics.bias.toLocaleString()} MW`,
      subtext: metrics.bias > 0 
        ? `${metrics.overForecastFrequency}% Over-forecast` 
        : `${metrics.underForecastFrequency}% Under-forecast`,
      desc: metrics.bias > 0 
        ? "Positive bias: Over-forecasting wind. Utility under-procures day-ahead and faces high System Buy Price cashout!"
        : "Negative bias: Under-forecasting wind. Utility over-procures thermal power and spills/sells excess at low cashout.",
      badge: metrics.bias > 0 ? "Shortfall Risk" : "Excess Risk",
      badgeColor: metrics.bias > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    },
    {
      label: "Peak Over / Under Error",
      value: `+${metrics.maxOverForecast} / ${metrics.maxUnderForecast} MW`,
      subtext: `P10: ${metrics.p10} MW | P90: +${metrics.p90} MW`,
      desc: "Worst-case peak half-hourly forecast swings and 10th/90th percentile uncertainty confidence interval.",
      badge: "Tail Risk",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    },
    {
      label: "Model Correlation (R²)",
      value: `${metrics.r2}`,
      subtext: "Variance explained",
      desc: "Proportion of real wind variation captured by the day-ahead National Grid ESO forecast.",
      badge: "Good Fit",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <div 
          key={i} 
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${c.badgeColor}`}>
                {c.badge}
              </span>
              <span className="text-slate-500 group-hover:text-slate-400 cursor-help" title={c.desc}>
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 truncate">{c.label}</p>
            <p className="text-lg font-bold text-white mt-1 tracking-tight">{c.value}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-400 truncate">{c.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

