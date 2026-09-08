import React from "react";
import { ShieldAlert, AlertTriangle, Mountain, Waves, Flame, Wind, Info, CheckCircle2 } from "lucide-react";
import { DisasterRisk } from "../types";
import { getAlertBadge } from "../utils/helpers";

interface DisasterRiskRadarProps {
  disasterRisk: DisasterRisk;
  locationName: string;
}

export const DisasterRiskRadar: React.FC<DisasterRiskRadarProps> = ({
  disasterRisk,
  locationName,
}) => {
  const badge = getAlertBadge(disasterRisk.alertLevel);
  const { slopeLandslide, urbanWaterlogging, heatStress, windGustHazard } = disasterRisk.scores;

  const getScoreColor = (val: number) => {
    if (val >= 70) return "text-rose-500 bg-rose-500";
    if (val >= 40) return "text-amber-400 bg-amber-400";
    return "text-emerald-400 bg-emerald-400";
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      {/* Alert Level Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Disaster & Climate Hazard Radar
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase">
                  Hazard Defense Core
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-factor hazard indexing: terrain slope, precipitation saturation, urban drainage, and wind squalls for {locationName}.
              </p>
            </div>
          </div>
        </div>

        {/* IMD Alert Level Badge */}
        <div className={`px-4 py-2 rounded-2xl border ${badge.bg} flex items-center gap-2 shrink-0`}>
          <span className={`w-2.5 h-2.5 rounded-full ${badge.dot} animate-ping`} />
          <span className="text-xs font-black uppercase tracking-wider">
            {disasterRisk.alertLevel} WATCH: {disasterRisk.alertTitle}
          </span>
        </div>
      </div>

      {/* Summary Prompt */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 mb-6 leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Atmospheric Hazard Assessment:</strong>
          {disasterRisk.alertSummary}
        </div>
      </div>

      {/* 4 Core Hazard Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Slope / Landslide */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Mountain className="w-4 h-4 text-sky-400" />
              Slope / Landslide
            </span>
            <span className={getScoreColor(slopeLandslide).split(" ")[0]}>{slopeLandslide}/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${getScoreColor(slopeLandslide).split(" ")[1]}`}
              style={{ width: `${slopeLandslide}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {disasterRisk.isMountainous
              ? "High terrain saturation sensitivity. Observe cut slopes & drainage."
              : "Plain terrain; minimal natural slope destabilization risk."}
          </p>
        </div>

        {/* 2. Urban Flooding / Waterlogging */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-blue-400" />
              Urban Waterlogging
            </span>
            <span className={getScoreColor(urbanWaterlogging).split(" ")[0]}>{urbanWaterlogging}/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${getScoreColor(urbanWaterlogging).split(" ")[1]}`}
              style={{ width: `${urbanWaterlogging}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Drainage stress index based on hourly precipitation volume & low-lying catchment zones.
          </p>
        </div>

        {/* 3. Heat Stress / Heatwave */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Heat Stress Index
            </span>
            <span className={getScoreColor(heatStress).split(" ")[0]}>{heatStress}/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${getScoreColor(heatStress).split(" ")[1]}`}
              style={{ width: `${heatStress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Thermal strain evaluated by wet-bulb temperature, relative humidity, and solar exposure.
          </p>
        </div>

        {/* 4. Wind Gust Hazard */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-purple-400" />
              Wind / Squall Hazard
            </span>
            <span className={getScoreColor(windGustHazard).split(" ")[0]}>{windGustHazard}/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${getScoreColor(windGustHazard).split(" ")[1]}`}
              style={{ width: `${windGustHazard}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Threat of falling tree branches, loose hoardings, and two-wheeler crosswind destabilization.
          </p>
        </div>
      </div>
    </div>
  );
};
