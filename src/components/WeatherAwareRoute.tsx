import React, { useState } from "react";
import { 
  Navigation, MapPin, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, 
  Car, Bike, RefreshCw, Eye, CloudRain 
} from "lucide-react";
import { RouteRiskResult } from "../types";

interface WeatherAwareRouteProps {
  currentCity: string;
}

export const WeatherAwareRoute: React.FC<WeatherAwareRouteProps> = ({ currentCity }) => {
  const [origin, setOrigin] = useState<string>(currentCity || "Delhi");
  const [destination, setDestination] = useState<string>("Chandigarh");
  const [transportMode, setTransportMode] = useState<string>("Car / Driving");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<RouteRiskResult | null>(null);

  const fetchRouteEvaluation = async (from: string, to: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch("/api/route-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: from,
          destination: to,
          transportMode,
        }),
      });
      const data = await resp.json();
      setRouteResult(data);
    } catch (err) {
      console.error("Route risk fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRouteEvaluation(origin, destination);
  }, [currentCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin.trim() && destination.trim()) {
      fetchRouteEvaluation(origin.trim(), destination.trim());
    }
  };

  return (
    <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Navigation className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Weather-Aware Route Intelligence
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Corridor Risk
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Maps calculate shortest distance. WeatherGPT evaluates road surface friction, visibility, and slope hazards.
              </p>
            </div>
          </div>
        </div>

        {/* Quick route presets */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 hidden md:inline">Presets:</span>
          <button
            onClick={() => {
              setOrigin("Delhi");
              setDestination("Chandigarh");
              fetchRouteEvaluation("Delhi", "Chandigarh");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Delhi → Chd
          </button>
          <button
            onClick={() => {
              setOrigin("Shimla");
              setDestination("Kufri");
              fetchRouteEvaluation("Shimla", "Kufri");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Shimla → Kufri
          </button>
        </div>
      </div>

      {/* Origin / Destination Search Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Origin
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 text-sm text-white rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              placeholder="Starting location"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Destination
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 text-sm text-white rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              placeholder="Destination city"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Evaluating Corridor..." : "Scan Route Hazards"}</span>
          </button>
        </div>
      </form>

      {/* Corridor Visualization */}
      {routeResult && (
        <div className="space-y-6">
          {/* Corridor Waypoint Ribbon */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Route Weather Corridor (Waypoint Breakdown)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {routeResult.corridorHops.map((hop, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 relative">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>KM {hop.km}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      hop.roadRisk === "HIGH" ? "bg-rose-500/20 text-rose-400" :
                      hop.roadRisk === "MODERATE" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {hop.roadRisk} RISK
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {hop.name}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{hop.weather} ({hop.temp}°C)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route A vs Route B Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Route A */}
            <div className={`p-5 rounded-2xl border transition ${
              routeResult.routeA.recommended
                ? "bg-emerald-950/20 border-emerald-500/40"
                : "bg-slate-950/60 border-slate-800"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">
                    {routeResult.routeA.name}
                  </span>
                </div>
                {routeResult.routeA.recommended ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recommended
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Avoid
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Distance</span>
                  <span className="font-bold text-slate-200">{routeResult.routeA.distanceKm} km</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Est. Time</span>
                  <span className="font-bold text-slate-200">{routeResult.routeA.estimatedTime}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Rain Risk</span>
                  <span className="font-bold text-amber-400">{routeResult.routeA.rainRisk}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                <strong className="text-slate-300">Hazard assessment:</strong> {routeResult.routeA.hazardRating}
              </div>
              <p className="text-xs text-rose-300/90 mt-2 font-medium">
                {routeResult.routeA.reason}
              </p>
            </div>

            {/* Route B */}
            <div className={`p-5 rounded-2xl border transition ${
              routeResult.routeB.recommended
                ? "bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                : "bg-slate-950/60 border-slate-800"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">
                    {routeResult.routeB.name}
                  </span>
                </div>
                {routeResult.routeB.recommended ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recommended
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Avoid
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Distance</span>
                  <span className="font-bold text-slate-200">{routeResult.routeB.distanceKm} km</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Est. Time</span>
                  <span className="font-bold text-slate-200">{routeResult.routeB.estimatedTime}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Rain Risk</span>
                  <span className="font-bold text-emerald-400">{routeResult.routeB.rainRisk}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                <strong className="text-slate-300">Hazard assessment:</strong> {routeResult.routeB.hazardRating}
              </div>
              <p className="text-xs text-emerald-300/90 mt-2 font-medium">
                {routeResult.routeB.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
