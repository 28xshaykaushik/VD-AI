import React from "react";
import { 
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake, 
  Wind, Droplets, Compass, ShieldAlert, AlertTriangle, ArrowUpRight, Clock, Umbrella, Sparkles
} from "lucide-react";
import { WeatherData } from "../types";
import { getAqiCategory, getUvCategory } from "../utils/helpers";

interface HeroWeatherCardProps {
  weather: WeatherData;
  onSelectHour?: (hour: any) => void;
  onOpenDepartureMode: () => void;
}

export const HeroWeatherCard: React.FC<HeroWeatherCardProps> = ({
  weather,
  onOpenDepartureMode,
}) => {
  const { location, current, hourly, daily, surpriseAlert, disasterRisk } = weather;

  const renderWeatherIcon = (iconName: string, className: string = "w-10 h-10") => {
    switch (iconName) {
      case "sun":
        return <Sun className={`${className} text-amber-400`} />;
      case "cloud-sun":
        return <CloudSun className={`${className} text-amber-300`} />;
      case "cloud":
        return <Cloud className={`${className} text-slate-300`} />;
      case "cloud-fog":
        return <CloudFog className={`${className} text-slate-400`} />;
      case "cloud-drizzle":
        return <CloudDrizzle className={`${className} text-cyan-400`} />;
      case "cloud-rain":
        return <CloudRain className={`${className} text-blue-400`} />;
      case "cloud-lightning":
        return <CloudLightning className={`${className} text-purple-400 animate-pulse`} />;
      case "snowflake":
        return <Snowflake className={`${className} text-sky-200`} />;
      default:
        return <Cloud className={`${className} text-slate-300`} />;
    }
  };

  const aqiInfo = getAqiCategory(current.aqi);
  const uvInfo = getUvCategory(current.uvIndex);

  return (
    <div className="space-y-4">
      {/* 1. Meaningful Weather Surprise Alert Bar (If Triggered) */}
      {surpriseAlert?.hasSurprise && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-orange-950/40 to-slate-900 border border-amber-500/40 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Weather Surprise Alert
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {surpriseAlert.title}
                </span>
              </div>
              <p className="text-sm text-slate-200 mt-0.5 font-medium">
                {surpriseAlert.description}
              </p>
              <p className="text-xs text-amber-200/90 mt-1 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Action: {surpriseAlert.actionPrompt}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDepartureMode}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <span>5-Min Departure Check</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Main Live Weather Dashboard Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6 lg:items-center">
          {/* Left: Location & Primary Temperature */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {location.name}
              </h1>
              {location.admin && (
                <span className="text-sm font-medium text-slate-400">
                  {location.admin}, {location.country}
                </span>
              )}
              {location.localTime && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-800/90 text-cyan-300 border border-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{location.localTime}</span>
                  {location.localDate && <span className="text-slate-400 font-normal">({location.localDate})</span>}
                </span>
              )}
              {location.isMountainous && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Mountainous Slope Zone
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter">
                {current.temp}°
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-semibold text-slate-200">
                    {current.condition}
                  </span>
                </div>
                <div className="text-sm text-slate-400 flex items-center gap-3">
                  <span>Feels like <strong className="text-slate-200">{current.feelsLike}°C</strong></span>
                  <span>•</span>
                  <span>Precipitation: <strong className="text-cyan-400">{current.precipitation} mm</strong></span>
                </div>
              </div>
            </div>

            {/* Hazard alert chip if present */}
            {current.hazard && current.hazard !== "None" && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Hazard Notice: {current.hazard}</span>
              </div>
            )}
          </div>

          {/* Right: Key Decision Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* AQI */}
            <div className={`p-3.5 rounded-2xl border ${aqiInfo.bg}`}>
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Air Quality</span>
                <span className={`font-bold ${aqiInfo.color}`}>AQI {current.aqi}</span>
              </div>
              <div className={`text-base font-bold mt-1 ${aqiInfo.color}`}>
                {aqiInfo.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                PM2.5: {current.pm25} µg/m³
              </div>
            </div>

            {/* Wind */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Wind Velocity</span>
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-white mt-1">
                {current.windSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Gusts: {current.windGusts} km/h
              </div>
            </div>

            {/* Humidity */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-base font-bold text-white mt-1">
                {current.humidity}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {current.humidity > 70 ? "Sticky / High Sweat" : "Comfortable Air"}
              </div>
            </div>

            {/* UV Index */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>UV Radiation</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base font-bold text-white mt-1">
                {current.uvIndex} <span className="text-xs font-normal text-amber-400">({uvInfo.label})</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate" title={uvInfo.advice}>
                {uvInfo.advice}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Hourly Forecast Horizontal Timeline */}
        <div className="mt-7 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                24-Hour Decision Timeline
              </h3>
              
              {/* Prominent Current Local Time Indicator */}
              {location.localTime ? (
                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span>
                    Current Time: <strong className="text-white font-mono">{location.localTime}</strong>
                  </span>
                  {location.localDate && (
                    <span className="text-slate-400 text-[11px]">({location.localDate})</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-medium border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Starting Now</span>
                </div>
              )}

              <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">
                {Math.min(24, hourly.length)} Hours Continuous
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> High Risk
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-slate-700">
            {hourly.slice(0, 24).map((item, idx) => {
              const isNow = idx === 0 || item.isCurrent;
              return (
                <div
                  key={idx}
                  className={`shrink-0 w-26 p-3 rounded-2xl border text-center transition-all hover:scale-105 cursor-pointer relative ${
                    isNow
                      ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400"
                      : item.riskTag === "HIGH"
                      ? "bg-rose-950/40 border-rose-500/40"
                      : item.riskTag === "MODERATE"
                      ? "bg-amber-950/30 border-amber-500/40"
                      : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80"
                  }`}
                  title={`${item.info.label} • Wind: ${item.windSpeed} km/h • Precip: ${item.precipMm} mm`}
                >
                  {/* Top Badge for Current Hour */}
                  {isNow && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-extrabold uppercase tracking-wide shadow-md whitespace-nowrap">
                      CURRENT
                    </div>
                  )}

                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {isNow ? "Now" : item.time}
                  </div>
                  
                  <div className="text-[10px] font-medium text-slate-400">
                    {isNow ? (location.localTime ? location.localTime.replace(/:\d{2}\s/, " ") : item.time) : (item.dateStr || `+${idx}h`)}
                  </div>

                  <div className="my-2 flex justify-center">
                    {renderWeatherIcon(item.info.icon, "w-6 h-6")}
                  </div>

                  <div className="text-sm font-bold text-white">
                    {item.temp}°
                  </div>

                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-cyan-300">
                    <Umbrella className="w-3 h-3" />
                    <span>{item.pop}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 7-Day Extended Outlook */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
            7-Day Planning Outlook
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {daily.map((day, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center justify-between text-center hover:bg-slate-800/60 transition"
              >
                <span className="text-xs font-bold text-slate-200">{day.day}</span>
                <div className="my-2">{renderWeatherIcon(day.info.icon, "w-6 h-6")}</div>
                <div className="text-xs font-semibold text-white">
                  {day.maxTemp}° <span className="text-slate-400 text-[11px]">/ {day.minTemp}°</span>
                </div>
                <div className="mt-1 text-[10px] text-cyan-300 flex items-center gap-0.5">
                  <Umbrella className="w-3 h-3 inline" />
                  <span>{day.pop}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
