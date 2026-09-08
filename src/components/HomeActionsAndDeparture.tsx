import React, { useState } from "react";
import { 
  Home, CheckSquare, Square, Clock, ShieldCheck, AlertCircle, 
  Umbrella, Smartphone, BatteryCharging, Shirt, Footprints, Wind, CheckCircle2 
} from "lucide-react";
import { HomeAction, WeatherData } from "../types";

interface HomeActionsAndDepartureProps {
  weather: WeatherData;
}

export const HomeActionsAndDeparture: React.FC<HomeActionsAndDepartureProps> = ({ weather }) => {
  const { homeActions, current, hourly } = weather;

  // Checklist state for 5-min before departure
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    umbrella: current.precipitation > 0 || (hourly?.[0]?.pop ?? 0) > 30,
    phone: true,
    powerBank: false,
    rainLayer: (hourly?.[0]?.pop ?? 0) > 40,
    shoes: true,
  });

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Find next precipitation window
  const nextRainHour = hourly?.find((h) => h.pop >= 40);
  const rainStatusMessage = nextRainHour
    ? `Rain window starting around ${nextRainHour.time} (${nextRainHour.pop}% probability).`
    : "Current conditions are dry and safe to step out immediately.";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. 5-MINUTE BEFORE LEAVING CHECKLIST */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  “5-Minute Before Leaving” Mode
                </h3>
                <p className="text-xs text-slate-400">
                  Ready to step out of the door? Verify your departure checklist.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
              Departure Check
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Item 1: Umbrella */}
            <div
              onClick={() => toggleCheck("umbrella")}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <Umbrella className="w-4 h-4 text-cyan-400" />
                <span>Compact Umbrella or Raincover</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checklist.umbrella ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Packed
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Square className="w-4 h-4" /> Grab it
                  </span>
                )}
              </div>
            </div>

            {/* Item 2: Phone */}
            <div
              onClick={() => toggleCheck("phone")}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Smartphone (Charged above 50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checklist.phone ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Square className="w-4 h-4" /> Need charge
                  </span>
                )}
              </div>
            </div>

            {/* Item 3: Power Bank */}
            <div
              onClick={() => toggleCheck("powerBank")}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <BatteryCharging className="w-4 h-4 text-amber-400" />
                <span>Backup Power Bank</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checklist.powerBank ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> With me
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Square className="w-4 h-4" /> Optional
                  </span>
                )}
              </div>
            </div>

            {/* Item 4: Rain Layer */}
            <div
              onClick={() => toggleCheck("rainLayer")}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <Shirt className="w-4 h-4 text-blue-400" />
                <span>Water-Repellent Outer Layer</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checklist.rainLayer ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Wearing
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Square className="w-4 h-4" /> Check weather
                  </span>
                )}
              </div>
            </div>

            {/* Item 5: Shoes */}
            <div
              onClick={() => toggleCheck("shoes")}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <Footprints className="w-4 h-4 text-indigo-400" />
                <span>Weather-Appropriate Footwear</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checklist.shoes ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> On feet
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Square className="w-4 h-4" /> Switch shoes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Departure Status Alert */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Current Departure Window:</strong> {rainStatusMessage}
          </div>
        </div>
      </div>

      {/* 2. WEATHER → HOME ACTIONS */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Home className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Weather → Home Actions
                </h3>
                <p className="text-xs text-slate-400">
                  Protect your home, laundry, sensitive plants, and vehicles before weather arrives.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
              Smart Home Rules
            </span>
          </div>

          <div className="space-y-3">
            {homeActions.map((action, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                  action.urgent
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl text-xs font-bold ${
                    action.urgent ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-300"
                  }`}>
                    {action.id === "windows" ? "🪟" : action.id === "laundry" ? "👕" : action.id === "plants" ? "🌱" : "🚗"}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{action.label}</div>
                    <div className="text-[10px] text-slate-400">
                      {action.urgent ? "High priority based on today's wind & moisture" : "Routine maintenance"}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  action.urgent
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {action.urgent ? "Action Needed" : "Safe"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Practical tip footer */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Proactive Safeguard:</strong> Preventing water seepage into balconies & vehicle covers prevents 90% of sudden storm damages.
          </div>
        </div>
      </div>
    </div>
  );
};
