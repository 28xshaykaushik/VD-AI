import React, { useState } from "react";
import { Dna, GitCompare, CheckCircle2, AlertTriangle, ShieldCheck, BarChart3, Info, Sliders } from "lucide-react";
import { WeatherDNA, ModelEnsemble, CurrentWeather } from "../types";
import { WeatherDNARadarChart } from "./WeatherDNARadarChart";

interface WeatherIntelligencePanelsProps {
  dna: WeatherDNA;
  modelEnsemble: ModelEnsemble;
  cityName: string;
  currentWeather?: CurrentWeather;
}

export const WeatherIntelligencePanels: React.FC<WeatherIntelligencePanelsProps> = ({
  dna,
  modelEnsemble,
  cityName,
  currentWeather,
}) => {
  const [activeView, setActiveView] = useState<"radar" | "bars">("radar");

  const dnaMetrics = [
    { label: "Cold Index", value: dna.cold, color: "bg-sky-400" },
    { label: "Precipitation Risk", value: dna.rain, color: "bg-blue-500" },
    { label: "Wind Velocity", value: dna.wind, color: "bg-cyan-400" },
    { label: "Optical Visibility", value: dna.visibility, color: "bg-emerald-400" },
    { label: "Outdoor Comfort", value: dna.outdoorComfort, color: "bg-indigo-400" },
    { label: "Travel Reliability", value: dna.travelReliability, color: "bg-teal-400" },
  ];

  // Derive biggest atmospheric concern
  const biggestConcern = 
    dna.rain >= 6 ? "precipitation & wet roads" :
    dna.cold >= 7 ? "severe drop in temperature" :
    dna.wind >= 6 ? "strong crosswinds & squalls" :
    dna.visibility <= 4 ? "low atmospheric visibility & fog" :
    "standard thermal fluctuations";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. WEATHER DNA OF A LOCATION (RECHARTS RADAR & SEASONAL BENCHMARK) */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Dna className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  {cityName} Weather DNA
                </h3>
                <p className="text-xs text-slate-400">
                  Seasonal radar profile converting meteorological vectors into atmospheric depth.
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                onClick={() => setActiveView("radar")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeView === "radar"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Radar Polygon Chart"
              >
                Radar Profile
              </button>
              <button
                onClick={() => setActiveView("bars")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeView === "bars"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Dimensional Metrics Bars"
              >
                Metrics
              </button>
            </div>
          </div>

          {/* Conditional View: Recharts Radar or Linear Bars */}
          {activeView === "radar" ? (
            <WeatherDNARadarChart
              dna={dna}
              cityName={cityName}
              currentWeather={currentWeather}
            />
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-3.5">
                {dnaMetrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">{m.label}</span>
                      <span className="text-slate-200 font-mono">{m.value} / 10</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${m.color}`}
                        style={{ width: `${m.value * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Semantic Takeaway */}
              <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">DNA Insight:</strong> Today {cityName}'s primary concern is{" "}
                  <span className="text-teal-300 font-bold underline decoration-teal-500/40">{biggestConcern}</span>,
                  rather than baseline air temperature.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. FORECAST ARGUMENT (MULTI-MODEL ENSEMBLE) */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <GitCompare className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Forecast Argument: Multi-Model Ensemble
                </h3>
                <p className="text-xs text-slate-400">
                  Compares European ECMWF, US GFS, German ICON, and IMD-WRF models for prediction consensus.
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
              modelEnsemble.consensus === "HIGH"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : modelEnsemble.consensus === "MEDIUM"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
            }`}>
              {modelEnsemble.consensus} Consensus
            </span>
          </div>

          {/* Model Comparison Grid */}
          <div className="space-y-2.5">
            {modelEnsemble.models.map((mod, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{mod.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Temp variance: {mod.tempOffset > 0 ? `+${mod.tempOffset}` : mod.tempOffset}°C
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-400">
                    {mod.rainProbability}% Rain Risk
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                      style={{ width: `${mod.rainProbability}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Argument Summary */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Ensemble Analysis:</strong> {modelEnsemble.analysis} Model spread variance is{" "}
            <span className="text-purple-300 font-bold">{modelEnsemble.varianceSpread}</span>.
          </div>
        </div>
      </div>
    </div>
  );
};
