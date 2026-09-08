import React, { useState, useMemo } from "react";
import { 
  Sliders, Play, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, 
  Bike, Umbrella, Home, Sun, CloudRain, Wind, Flame, Eye 
} from "lucide-react";
import { WeatherData } from "../types";

interface AtmosphericSandboxProps {
  currentWeather: WeatherData;
  onApplyToDashboard?: (simulatedData: Partial<WeatherData>) => void;
}

interface SimulationPreset {
  id: string;
  name: string;
  desc: string;
  icon: string;
  temp: number;
  rain: number;
  wind: number;
  aqi: number;
}

const PRESETS: SimulationPreset[] = [
  {
    id: "monsoon",
    name: "Monsoon Torrent",
    desc: "Active cloudburst, 90% rain, slippery asphalt",
    icon: "🌧️",
    temp: 24,
    rain: 92,
    wind: 38,
    aqi: 65,
  },
  {
    id: "heatwave",
    name: "Scorching Heatwave",
    desc: "44°C ambient, dehydration risk, high UV",
    icon: "🔥",
    temp: 44,
    rain: 5,
    wind: 18,
    aqi: 220,
  },
  {
    id: "fog",
    name: "Dense Winter Smog",
    desc: "Low visibility (<100m), hazardous AQI 380",
    icon: "🌫️",
    temp: 9,
    rain: 15,
    wind: 6,
    aqi: 380,
  },
  {
    id: "cyclone",
    name: "Severe Gale Storm",
    desc: "Wind gusts > 75 km/h, flying debris danger",
    icon: "🌀",
    temp: 26,
    rain: 80,
    wind: 78,
    aqi: 50,
  },
  {
    id: "pleasant",
    name: "Pleasant Spring",
    desc: "22°C gentle breeze, ideal outdoor window",
    icon: "🌤️",
    temp: 22,
    rain: 10,
    wind: 12,
    aqi: 45,
  },
];

export const AtmosphericSandbox: React.FC<AtmosphericSandboxProps> = ({
  currentWeather,
}) => {
  const [temp, setTemp] = useState<number>(currentWeather.current.temp);
  const [rainProb, setRainProb] = useState<number>(
    currentWeather.current.precipitation > 0 ? 85 : 25
  );
  const [windSpeed, setWindSpeed] = useState<number>(currentWeather.current.windSpeed);
  const [aqi, setAqi] = useState<number>(currentWeather.current.aqi || 95);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (p: SimulationPreset) => {
    setActivePreset(p.id);
    setTemp(p.temp);
    setRainProb(p.rain);
    setWindSpeed(p.wind);
    setAqi(p.aqi);
  };

  const resetToLive = () => {
    setActivePreset(null);
    setTemp(currentWeather.current.temp);
    setRainProb(currentWeather.current.precipitation > 0 ? 80 : 25);
    setWindSpeed(currentWeather.current.windSpeed);
    setAqi(currentWeather.current.aqi || 95);
  };

  // Dynamic Decision Engine Evaluation
  const simulationResults = useMemo(() => {
    let score = 100;
    const risks: string[] = [];
    const recommendedActions: string[] = [];

    // Rain analysis
    if (rainProb > 70) {
      score -= 40;
      risks.push("Severe waterlogging & hydroplaning risk on roads");
      recommendedActions.push("Carry a windproof heavy umbrella + waterproof backpack cover");
    } else if (rainProb > 40) {
      score -= 20;
      risks.push("Intermittent slippery road conditions & drizzle");
      recommendedActions.push("Pack a compact foldaway umbrella or rain poncho");
    }

    // Heat / Cold analysis
    if (temp > 40) {
      score -= 30;
      risks.push("Heat exhaustion, severe dehydration & sunstroke warning");
      recommendedActions.push("Carry 1.5L ORS/electrolytes; strictly avoid sun 12 PM – 4 PM");
    } else if (temp < 10) {
      score -= 20;
      risks.push("Hypothermia risk during extended stationary exposure");
      recommendedActions.push("Wear thermal base-layer, wool socks, and windproof outer shell");
    }

    // Wind analysis
    if (windSpeed > 50) {
      score -= 35;
      risks.push("Destabilizing crosswinds for 2-wheelers & falling branch danger");
      recommendedActions.push("Do not park beneath trees; avoid highway two-wheeler transit");
    } else if (windSpeed > 30) {
      score -= 15;
      risks.push("Gusty conditions causing steering instability");
      recommendedActions.push("Secure balcony objects, loose clothes, and canopy shades");
    }

    // AQI analysis
    if (aqi > 250) {
      score -= 25;
      risks.push("Hazardous particulate inhalation (severe respiratory distress)");
      recommendedActions.push("N95/N99 respirator mask mandatory; keep indoor air purifiers on high");
    } else if (aqi > 150) {
      score -= 10;
      risks.push("Unhealthy air for sensitive individuals & outdoor cardio");
      recommendedActions.push("Wear PM2.5 filtration mask during active street transit");
    }

    const finalScore = Math.max(8, Math.min(99, score));
    const status =
      finalScore > 75
        ? { tag: "Safe to Proceed", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" }
        : finalScore > 45
        ? { tag: "Proceed with Caution", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" }
        : { tag: "High Hazard / Delay Advised", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" };

    return {
      score: finalScore,
      status,
      risks,
      recommendedActions,
      bikeSafe: windSpeed < 45 && rainProb < 65 && aqi < 250,
      umbrellaRequired: rainProb > 35,
      maskRequired: aqi > 160,
    };
  }, [temp, rainProb, windSpeed, aqi]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Atmospheric Decision Sandbox
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Interactive Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Stress-test the VyoomDut decision engine. Drag sliders or trigger extreme climate events to see how feasibility, gear advice, and hazard protocols dynamically respond.
            </p>
          </div>

          <button
            onClick={resetToLive}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Live Ground Data</span>
          </button>
        </div>

        {/* Quick Simulation Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Instant Climate Scenarios:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  activePreset === preset.id
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                    : "bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-base">
                  <span>{preset.icon}</span>
                  <span className="text-[10px] font-bold text-slate-400">{preset.temp}°C</span>
                </div>
                <div className="text-xs font-bold text-white mt-1">{preset.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Controls & Live Verdict Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Interactive Sliders */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>Adjust Atmospheric Variables</span>
            </h3>

            {/* Slider 1: Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Ambient Temperature
                </span>
                <span className="text-sm font-black text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  {temp}°C
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="50"
                value={temp}
                onChange={(e) => {
                  setActivePreset(null);
                  setTemp(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-5°C (Freezing)</span>
                <span>25°C (Mild)</span>
                <span>50°C (Extreme Heat)</span>
              </div>
            </div>

            {/* Slider 2: Rain Probability */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  Rain & Precipitation Risk
                </span>
                <span className="text-sm font-black text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  {rainProb}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rainProb}
                onChange={(e) => {
                  setActivePreset(null);
                  setRainProb(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Dry)</span>
                <span>50% (Showers)</span>
                <span>100% (Torrential)</span>
              </div>
            </div>

            {/* Slider 3: Wind Velocity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-teal-400" />
                  Wind Gust Velocity
                </span>
                <span className="text-sm font-black text-teal-300 px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  {windSpeed} km/h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={windSpeed}
                onChange={(e) => {
                  setActivePreset(null);
                  setWindSpeed(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 km/h (Calm)</span>
                <span>35 km/h (Breezy)</span>
                <span>100 km/h (Gale)</span>
              </div>
            </div>

            {/* Slider 4: Air Quality Index (AQI) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-400" />
                  Air Quality Index (AQI)
                </span>
                <span className="text-sm font-black text-purple-300 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  {aqi} AQI
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="450"
                value={aqi}
                onChange={(e) => {
                  setActivePreset(null);
                  setAqi(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>20 (Good)</span>
                <span>150 (Moderate)</span>
                <span>450 (Severe / Toxic)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Simulated Decision Verdict */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-5">
            {/* Feasibility Metric Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-400">
                  Simulated Outdoor Feasibility
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white">
                    {simulationResults.score}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold ${simulationResults.status.color}`}>
                {simulationResults.status.tag}
              </div>
            </div>

            {/* Quick Micro-Rules Indicators */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Umbrella */}
              <div className={`p-3 rounded-2xl border text-center ${
                simulationResults.umbrellaRequired 
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}>
                <Umbrella className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-bold">
                  {simulationResults.umbrellaRequired ? "Carry Umbrella" : "No Umbrella"}
                </div>
              </div>

              {/* Two-Wheeler */}
              <div className={`p-3 rounded-2xl border text-center ${
                simulationResults.bikeSafe
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/40 text-rose-300"
              }`}>
                <Bike className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-bold">
                  {simulationResults.bikeSafe ? "Bike Safe" : "Bike Hazardous"}
                </div>
              </div>

              {/* N95 Mask */}
              <div className={`p-3 rounded-2xl border text-center ${
                simulationResults.maskRequired
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}>
                <ShieldAlert className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-bold">
                  {simulationResults.maskRequired ? "Wear N95 Mask" : "Mask Optional"}
                </div>
              </div>
            </div>

            {/* Simulated Hazard Warnings */}
            {simulationResults.risks.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Detected Hazard Triggers ({simulationResults.risks.length})</span>
                </div>
                <ul className="space-y-1.5">
                  {simulationResults.risks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-200/90 bg-rose-950/30 border border-rose-500/30 p-2 rounded-xl flex items-start gap-2"
                    >
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Precautions */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AI Action Protocol</span>
              </div>
              <ul className="space-y-1.5">
                {simulationResults.recommendedActions.map((action, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-200 bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2"
                  >
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
