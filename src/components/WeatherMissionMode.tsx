import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, XCircle, Clock, ShieldCheck, 
  Bike, Car, Footprints, Mountain, Tent, Camera, Trophy, PartyPopper, Briefcase, GraduationCap, Plane,
  AlertTriangle, ArrowRight, RefreshCw, Shirt, HelpCircle
} from "lucide-react";
import { WeatherData, MissionResult } from "../types";

interface WeatherMissionModeProps {
  weather: WeatherData;
  language: string;
  onOpenBagModal: () => void;
}

const ACTIVITIES = [
  { id: "Bike ride", label: "Bike Ride", icon: Bike, desc: "High road-friction & wind exposure" },
  { id: "Walking", label: "Walking / Jog", icon: Footprints, desc: "Direct precipitation exposure" },
  { id: "Driving", label: "Driving", icon: Car, desc: "Visibility & highway spray conditions" },
  { id: "Trekking", label: "Trekking / Hike", icon: Mountain, desc: "Slope stability & sudden storms" },
  { id: "Picnic", label: "Picnic / Park", icon: Tent, desc: "Ground dampness & UV radiation" },
  { id: "Outdoor sports", label: "Outdoor Sports", icon: Trophy, desc: "Heat index & turf traction" },
  { id: "Event", label: "Outdoor Party / Event", icon: PartyPopper, desc: "Setup durability & guest comfort" },
  { id: "Photography", label: "Photography", icon: Camera, desc: "Golden hour & lens moisture protection" },
  { id: "Office", label: "Office Commute", icon: Briefcase, desc: "Document & laptop waterproofing" },
  { id: "College", label: "College / School", icon: GraduationCap, desc: "Bicycle / bus transit safety" },
  { id: "Travel", label: "Multi-day Travel", icon: Plane, desc: "Luggage packing & route variance" },
];

const TRANSPORT_MODES = [
  "Two-wheeler / Bike",
  "Walking / Pedestrian",
  "Car / Cab (AC)",
  "Metro / Public Transit",
  "Intercity Bus",
];

const TIME_WINDOWS = [
  "Next 2 Hours",
  "Morning (7 AM – 11 AM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening Rush (4 PM – 8 PM)",
  "Night (8 PM – Midnight)",
  "Full Day Plan",
];

export const WeatherMissionMode: React.FC<WeatherMissionModeProps> = ({
  weather,
  language,
  onOpenBagModal,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string>("Bike ride");
  const [selectedTransport, setSelectedTransport] = useState<string>("Two-wheeler / Bike");
  const [selectedWindow, setSelectedWindow] = useState<string>("Evening Rush (4 PM – 8 PM)");
  const [activePlanTab, setActivePlanTab] = useState<"planA" | "planB" | "planC">("planA");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [missionResult, setMissionResult] = useState<MissionResult | null>(null);

  // Trigger evaluation
  const handleEvaluateMission = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: selectedActivity,
          locationName: weather.location.name,
          timeWindow: selectedWindow,
          transportMode: selectedTransport,
          weatherData: weather,
          language,
        }),
      });
      const data = await response.json();
      setMissionResult(data);
    } catch (err) {
      console.error("Mission eval failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Initial evaluation on mount or activity switch if not yet loaded
  React.useEffect(() => {
    handleEvaluateMission();
  }, [selectedActivity, weather.location.name]);

  const score = missionResult?.feasibilityScore ?? 68;
  const scoreColor = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-500";
  const scoreRing = score >= 75 ? "border-emerald-500" : score >= 50 ? "border-amber-500" : "border-rose-500";

  return (
    <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Weather Mission Mode
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Decision Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                “Main kya karne ja raha hoon?” — Enter your activity to calculate real-world feasibility and packing advice.
              </p>
            </div>
          </div>
        </div>

        {/* Re-calculate button */}
        <button
          onClick={handleEvaluateMission}
          disabled={isEvaluating}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
          <span>{isEvaluating ? "Evaluating Atmosphere..." : "Recalculate Mission"}</span>
        </button>
      </div>

      {/* Activity Selector Grid */}
      <div className="mt-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
          Step 1: Select Your Planned Activity
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {ACTIVITIES.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedActivity === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedActivity(item.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-500 shadow-md shadow-cyan-500/10 scale-[1.02]"
                    : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameters: Transport & Time Window */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Step 2: Transport Mode
          </label>
          <select
            value={selectedTransport}
            onChange={(e) => setSelectedTransport(e.target.value)}
            className="w-full bg-slate-800/90 text-sm text-slate-100 rounded-xl border border-slate-700 p-2.5 focus:outline-none focus:border-cyan-500"
          >
            {TRANSPORT_MODES.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-white">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Step 3: Time Window
          </label>
          <select
            value={selectedWindow}
            onChange={(e) => setSelectedWindow(e.target.value)}
            className="w-full bg-slate-800/90 text-sm text-slate-100 rounded-xl border border-slate-700 p-2.5 focus:outline-none focus:border-cyan-500"
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w} value={w} className="bg-slate-900 text-white">
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Results Display */}
      {missionResult && (
        <div className="mt-8 space-y-6">
          {/* Mission Score & AI Verdict Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-5">
              {/* Feasibility Ring */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className={`w-24 h-24 rounded-full border-4 ${scoreRing} flex flex-col items-center justify-center bg-slate-900/90 shadow-lg`}>
                  <span className={`text-3xl font-black ${scoreColor}`}>
                    {missionResult.feasibilityScore}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Score / 100
                  </span>
                </div>
              </div>

              {/* Verdict Text */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mission Feasibility Verdict
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${
                    score >= 75
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : score >= 50
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}>
                    {missionResult.statusTag}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-100 mt-1.5 leading-relaxed">
                  {missionResult.verdictSummary}
                </p>
              </div>
            </div>

            {/* Quick Bag Camera Link */}
            <button
              onClick={onOpenBagModal}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-2 shadow-md"
            >
              <span>Scan Packed Bag (Vision AI)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Column: "WHAT SHOULD I CARRY?" vs "WHAT SHOULD I NOT CARRY?" */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. SMART CARRY ADVISOR */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  What You Should Carry
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Items matched precisely to today's moisture, temperature, and duration:
              </p>
              <div className="space-y-2.5">
                {missionResult.carry.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-start gap-2.5">
                    <span className="text-emerald-400 text-sm font-bold mt-0.5">✅</span>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{item.item}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. REVERSE PACKING AI ("WHAT SHOULD I NOT CARRY?") */}
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Reverse Packing: Don't Carry / Avoid
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  Anti-Hassle AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Items that add dead weight, risk damage, or are completely unnecessary today:
              </p>
              <div className="space-y-2.5">
                {missionResult.dontCarry.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 flex items-start gap-2.5">
                    <span className="text-rose-400 text-sm font-bold mt-0.5">🚫</span>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{item.item}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. BEST TIME TO GO ENGINE */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  “Best Time to Go” Engine
                </h3>
              </div>
              <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                Optimal Window: {missionResult.bestTime.recommendedDeparture}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  Hazard / High-Risk Window to Avoid:
                </div>
                <div className="text-sm font-extrabold text-rose-400 mt-0.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{missionResult.bestTime.hazardWindow}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {missionResult.bestTime.explanation}
                </p>
              </div>

              <div className="shrink-0 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                  Recommended Departure
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  {missionResult.bestTime.recommendedDeparture}
                </div>
              </div>
            </div>
          </div>

          {/* 4. PLAN A / PLAN B / PLAN C ALTERNATIVES */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Plan A / Plan B / Plan C Scenarios
              </h3>
              <span className="text-xs text-slate-400">
                Never get stranded by sudden weather
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Plan A */}
              <div 
                onClick={() => setActivePlanTab("planA")}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  activePlanTab === "planA"
                    ? "bg-slate-800 border-cyan-500 shadow-md"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Plan A (Original)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200">
                    Score {missionResult.plans.planA.score}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mb-1">
                  {missionResult.plans.planA.name}
                </div>
                <p className="text-[11px] text-slate-400">
                  {missionResult.plans.planA.description}
                </p>
              </div>

              {/* Plan B */}
              <div 
                onClick={() => setActivePlanTab("planB")}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  activePlanTab === "planB"
                    ? "bg-slate-800 border-cyan-500 shadow-md"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Plan B (Indoor Backup)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                    Score {missionResult.plans.planB.score}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mb-1">
                  {missionResult.plans.planB.name}
                </div>
                <p className="text-[11px] text-slate-400">
                  {missionResult.plans.planB.description}
                </p>
              </div>

              {/* Plan C */}
              <div 
                onClick={() => setActivePlanTab("planC")}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  activePlanTab === "planC"
                    ? "bg-slate-800 border-cyan-500 shadow-md"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Plan C (Time Shift)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                    Score {missionResult.plans.planC.score}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mb-1">
                  {missionResult.plans.planC.name}
                </div>
                <p className="text-[11px] text-slate-400">
                  {missionResult.plans.planC.description}
                </p>
              </div>
            </div>
          </div>

          {/* 5. OUTFIT SURVIVAL MODE */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Shirt className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Outfit Survival & Transit Gear Mode
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  🧥 Wear This
                </span>
                <ul className="text-xs text-slate-300 space-y-1">
                  {missionResult.outfitAdvice.wear.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span> {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                  👟 Avoid Wearing
                </span>
                <ul className="text-xs text-slate-300 space-y-1">
                  {missionResult.outfitAdvice.avoid.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400">✗</span> {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                  🛡️ {selectedTransport} Transit Rule
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {missionResult.outfitAdvice.transportTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
