import React, { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { 
  Sparkles, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Compass, 
  Info,
  Droplets,
  Flame,
  Wind,
  Eye,
  Smile,
  CloudRain
} from "lucide-react";
import { WeatherDNA, CurrentWeather } from "../types";

export type SeasonKey = "current_season" | "monsoon" | "summer" | "winter";

interface SeasonalProfile {
  label: string;
  period: string;
  summary: string;
  rain: number;
  heat: number;
  wind: number;
  humidity: number;
  visibility: number;
  comfort: number;
}

interface WeatherDNARadarChartProps {
  dna: WeatherDNA;
  cityName: string;
  currentWeather?: CurrentWeather;
}

// Seasonal baselines for major climate zones
function getCitySeasonalProfiles(cityName: string, currentWeather?: CurrentWeather): Record<SeasonKey, SeasonalProfile> {
  const normCity = (cityName || "").toLowerCase();

  // 1. Coastal / Tropical Heavy (e.g. Mumbai, Goa, Kochi, Mangalore)
  if (normCity.includes("mumbai") || normCity.includes("goa") || normCity.includes("kochi") || normCity.includes("kerala")) {
    return {
      current_season: {
        label: "Post-Monsoon Transition",
        period: "September - October",
        summary: "Monsoon taper-off with high humidity and moderate evening rain.",
        rain: 58,
        heat: 72,
        wind: 48,
        humidity: 82,
        visibility: 68,
        comfort: 55,
      },
      monsoon: {
        label: "Southwest Monsoon",
        period: "June - August",
        summary: "Relentless torrential downpours, sea squalls, and saturated humidity.",
        rain: 95,
        heat: 60,
        wind: 75,
        humidity: 94,
        visibility: 48,
        comfort: 38,
      },
      summer: {
        label: "Pre-Monsoon Summer",
        period: "March - May",
        summary: "Intense coastal swelter with high humidity and warm sea breezes.",
        rain: 12,
        heat: 84,
        wind: 45,
        humidity: 78,
        visibility: 72,
        comfort: 45,
      },
      winter: {
        label: "Mild Coastal Winter",
        period: "December - February",
        summary: "Pleasant, balmy, clear skies with minimal humidity and no rain.",
        rain: 5,
        heat: 64,
        wind: 38,
        humidity: 62,
        visibility: 82,
        comfort: 88,
      },
    };
  }

  // 2. Mountain / Highland (e.g. Shimla, Manali, Srinagar, Darjeeling, Ooty)
  if (normCity.includes("shimla") || normCity.includes("manali") || normCity.includes("srinagar") || normCity.includes("leh") || normCity.includes("darjeeling") || normCity.includes("ooty")) {
    return {
      current_season: {
        label: "Autumn Crisp Transition",
        period: "September - October",
        summary: "Clearing skies after rains, brisk mountain breeze, high visibility.",
        rain: 38,
        heat: 40,
        wind: 42,
        humidity: 65,
        visibility: 82,
        comfort: 80,
      },
      monsoon: {
        label: "Himalayan Monsoon",
        period: "July - August",
        summary: "Cloud bursts, dense mountain fog, high moisture, landslide risk.",
        rain: 88,
        heat: 45,
        wind: 52,
        humidity: 92,
        visibility: 35,
        comfort: 50,
      },
      summer: {
        label: "Pleasant Mountain Summer",
        period: "April - June",
        summary: "Temperate sunny days, cool mountain gusts, prime outdoor comfort.",
        rain: 30,
        heat: 58,
        wind: 38,
        humidity: 50,
        visibility: 90,
        comfort: 94,
      },
      winter: {
        label: "Alpine Winter & Snow",
        period: "December - February",
        summary: "Freezing temperatures, western disturbances, snowfall, icy winds.",
        rain: 45,
        heat: 15,
        wind: 60,
        humidity: 55,
        visibility: 70,
        comfort: 52,
      },
    };
  }

  // 3. Deccan Plateau / Moderate (e.g. Bengaluru, Pune, Hyderabad, Mysuru)
  if (normCity.includes("bengaluru") || normCity.includes("bangalore") || normCity.includes("pune") || normCity.includes("mysore") || normCity.includes("hyderabad")) {
    return {
      current_season: {
        label: "Late Monsoon Transition",
        period: "September - October",
        summary: "Breezy overcast afternoons with sporadic thunder showers.",
        rain: 65,
        heat: 56,
        wind: 52,
        humidity: 78,
        visibility: 75,
        comfort: 80,
      },
      monsoon: {
        label: "Southwest Monsoon",
        period: "June - August",
        summary: "Steady drizzle, cool persistent gusts, high cloud cover.",
        rain: 78,
        heat: 50,
        wind: 62,
        humidity: 86,
        visibility: 68,
        comfort: 74,
      },
      summer: {
        label: "Plateau Summer",
        period: "March - May",
        summary: "Warm afternoons but cool evenings with convective pre-monsoon showers.",
        rain: 32,
        heat: 78,
        wind: 40,
        humidity: 52,
        visibility: 85,
        comfort: 68,
      },
      winter: {
        label: "Crisp Mild Winter",
        period: "December - February",
        summary: "Cool mornings, balmy afternoons, gentle dry air, peak comfort.",
        rain: 8,
        heat: 46,
        wind: 35,
        humidity: 58,
        visibility: 88,
        comfort: 95,
      },
    };
  }

  // 4. Default / Northern Plains & Continental Extreme (e.g. Delhi, Chandigarh, Lucknow, Jaipur, Patna, Ahmedabad)
  return {
    current_season: {
      label: "Late Monsoon / Post-Monsoon",
      period: "September - October",
      summary: "Receding rains, transitioning thermal load, moderate breezes.",
      rain: 42,
      heat: 74,
      wind: 38,
      humidity: 68,
      visibility: 62,
      comfort: 66,
    },
    monsoon: {
      label: "Plains Monsoon Season",
      period: "July - August",
      summary: "High humidity, flash convective rain spells, urban waterlogging.",
      rain: 84,
      heat: 68,
      wind: 45,
      humidity: 85,
      visibility: 58,
      comfort: 48,
    },
    summer: {
      label: "Scorching Loo Summer",
      period: "April - June",
      summary: "Extreme thermal radiation, dry dust-bearing westerly winds, low humidity.",
      rain: 15,
      heat: 96,
      wind: 55,
      humidity: 32,
      visibility: 70,
      comfort: 25,
    },
    winter: {
      label: "Plains Winter & Fog Inversion",
      period: "December - January",
      summary: "Brisk cold, morning radiation fog & particulate inversion, calm winds.",
      rain: 12,
      heat: 22,
      wind: 24,
      humidity: 72,
      visibility: 32,
      comfort: 70,
    },
  };
}

export const WeatherDNARadarChart: React.FC<WeatherDNARadarChartProps> = ({
  dna,
  cityName,
  currentWeather,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>("current_season");

  // Get seasonal profiles
  const profiles = useMemo(() => {
    return getCitySeasonalProfiles(cityName, currentWeather);
  }, [cityName, currentWeather]);

  const activeSeasonalProfile = profiles[selectedSeason];

  // Derive normalized 0-100 values for current conditions
  const liveValues = useMemo(() => {
    // Rain: combine DNA rain and precipitation
    const rain = Math.min(100, Math.max(0, Math.round(dna.rain * 10)));
    
    // Heat: based on temp and feelsLike
    let heat = 50;
    if (currentWeather) {
      const temp = currentWeather.feelsLike ?? currentWeather.temp;
      // map 5°C -> 10, 25°C -> 50, 42°C -> 95
      heat = Math.min(100, Math.max(0, Math.round(((temp - 5) / 40) * 100)));
    } else {
      heat = Math.min(100, Math.max(0, Math.round((10 - dna.cold) * 10)));
    }

    // Wind: based on wind speed
    let wind = Math.min(100, Math.max(0, Math.round(dna.wind * 10)));
    if (currentWeather) {
      wind = Math.min(100, Math.max(0, Math.round((currentWeather.windSpeed / 60) * 100)));
    }

    // Humidity
    const humidity = currentWeather ? currentWeather.humidity : 60;

    // Visibility: based on dna.visibility
    const visibility = Math.min(100, Math.max(0, Math.round(dna.visibility * 10)));

    // Comfort: based on dna.outdoorComfort
    const comfort = Math.min(100, Math.max(0, Math.round(dna.outdoorComfort * 10)));

    return { rain, heat, wind, humidity, visibility, comfort };
  }, [dna, currentWeather]);

  // Recharts Radar Data Structure
  const radarData = useMemo(() => {
    return [
      {
        dimension: "Rain Risk",
        fullLabel: "Precipitation Risk",
        icon: CloudRain,
        current: liveValues.rain,
        seasonal: activeSeasonalProfile.rain,
        unit: "%",
        color: "#38bdf8",
      },
      {
        dimension: "Thermal Heat",
        fullLabel: "Thermal Load / Heat Index",
        icon: Flame,
        current: liveValues.heat,
        seasonal: activeSeasonalProfile.heat,
        unit: "/100",
        color: "#f97316",
      },
      {
        dimension: "Wind Gusts",
        fullLabel: "Wind Energy & Gusts",
        icon: Wind,
        current: liveValues.wind,
        seasonal: activeSeasonalProfile.wind,
        unit: "/100",
        color: "#06b6d4",
      },
      {
        dimension: "Air Moisture",
        fullLabel: "Relative Humidity",
        icon: Droplets,
        current: liveValues.humidity,
        seasonal: activeSeasonalProfile.humidity,
        unit: "%",
        color: "#60a5fa",
      },
      {
        dimension: "Visibility",
        fullLabel: "Optical Air Clarity",
        icon: Eye,
        current: liveValues.visibility,
        seasonal: activeSeasonalProfile.visibility,
        unit: "/100",
        color: "#34d399",
      },
      {
        dimension: "Comfort",
        fullLabel: "Bio-Meteorological Comfort",
        icon: Smile,
        current: liveValues.comfort,
        seasonal: activeSeasonalProfile.comfort,
        unit: "/100",
        color: "#a78bfa",
      },
    ];
  }, [liveValues, activeSeasonalProfile]);

  // Derive atmospheric anomaly narrative
  const biggestAnomaly = useMemo(() => {
    let maxDiff = 0;
    let anomaly = {
      dim: "Equilibrium",
      diff: 0,
      text: "Conditions align closely with historical seasonal normal.",
      type: "neutral" as "high" | "low" | "neutral",
    };

    radarData.forEach((item) => {
      const diff = item.current - item.seasonal;
      if (Math.abs(diff) > Math.abs(maxDiff)) {
        maxDiff = diff;
        if (diff > 15) {
          anomaly = {
            dim: item.fullLabel,
            diff,
            text: `${item.dimension} is +${diff}% higher than typical ${activeSeasonalProfile.label} normal.`,
            type: "high",
          };
        } else if (diff < -15) {
          anomaly = {
            dim: item.fullLabel,
            diff,
            text: `${item.dimension} is ${Math.abs(diff)}% lower than typical ${activeSeasonalProfile.label} normal.`,
            type: "low",
          };
        }
      }
    });

    return anomaly;
  }, [radarData, activeSeasonalProfile]);

  return (
    <div className="w-full flex flex-col justify-between">
      {/* Top Header & Seasonal Profile Switcher */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Atmospheric Radar
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">
                Recharts Radar 3.x
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Weather DNA overlaid on {cityName}’s historical seasonal baseline.
            </p>
          </div>

          {/* Season Selector Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedSeason("current_season")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                selectedSeason === "current_season"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Current Season
            </button>
            <button
              onClick={() => setSelectedSeason("monsoon")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                selectedSeason === "monsoon"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Monsoon
            </button>
            <button
              onClick={() => setSelectedSeason("summer")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                selectedSeason === "summer"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Summer
            </button>
            <button
              onClick={() => setSelectedSeason("winter")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                selectedSeason === "winter"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Winter
            </button>
          </div>
        </div>

        {/* Seasonal Benchmark Context Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              Benchmark: <strong className="text-white font-semibold">{activeSeasonalProfile.label}</strong>{" "}
              <span className="text-slate-500">({activeSeasonalProfile.period})</span>
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 italic truncate max-w-[280px]">
            {activeSeasonalProfile.summary}
          </span>
        </div>

        {/* The Recharts Radar Chart */}
        <div className="relative w-full h-[280px] sm:h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 9 }}
                stroke="#334155"
              />
              {/* Seasonal Benchmark Layer */}
              <Radar
                name={`Seasonal Normal (${activeSeasonalProfile.label})`}
                dataKey="seasonal"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* Current Active Weather DNA Layer */}
              <Radar
                name="Current Live DNA"
                dataKey="current"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.45}
                strokeWidth={2.5}
              />
              <Tooltip content={<CustomRadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center justify-center gap-6 text-xs mt-1 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-cyan-500/40 border border-cyan-400 shadow-sm" />
            <span className="text-slate-200 font-semibold text-[11px]">
              Current Live Weather DNA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-amber-400" />
            <span className="text-slate-400 font-medium text-[11px]">
              {activeSeasonalProfile.label} (Norm)
            </span>
          </div>
        </div>

        {/* Dimension Metric Breakdown Pills */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {radarData.map((item, idx) => {
            const diff = item.current - item.seasonal;
            return (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center flex flex-col justify-between"
              >
                <div className="text-[10px] text-slate-400 font-medium truncate mb-1">
                  {item.dimension}
                </div>
                <div className="text-xs font-bold text-white font-mono">
                  {item.current}
                  <span className="text-[10px] text-slate-500 ml-0.5">/{item.seasonal}</span>
                </div>
                <div className="mt-1">
                  {Math.abs(diff) <= 5 ? (
                    <span className="text-[9px] text-slate-400 font-medium">Normal</span>
                  ) : diff > 0 ? (
                    <span className="text-[9px] text-rose-400 font-bold flex items-center justify-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />+{diff}
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-bold flex items-center justify-center gap-0.5">
                      <TrendingDown className="w-2.5 h-2.5" />{diff}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Atmospheric Anomaly Takeaway */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-white font-bold">Atmospheric Depth & Anomaly: </span>
          <span className="text-slate-300">{biggestAnomaly.text} </span>
          <span className="text-slate-400">
            Comparing live barometric & thermal metrics against {cityName}’s seasonal climatology reveals how today’s weather behavior diverges from typical patterns.
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for Radar Chart
function CustomRadarTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const currentVal = data.current;
    const seasonalVal = data.seasonal;
    const diff = currentVal - seasonalVal;

    return (
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs backdrop-blur-md max-w-[240px]">
        <div className="font-extrabold text-white mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
          <span>{data.fullLabel}</span>
          <span className="text-[10px] text-cyan-400 font-mono">Index</span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-medium">Live DNA:</span>
            <span className="font-bold text-white font-mono">{currentVal} {data.unit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-medium">Seasonal Normal:</span>
            <span className="font-bold text-slate-300 font-mono">{seasonalVal} {data.unit}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
            <span className="text-slate-400">Deviation:</span>
            <span className={`font-bold ${diff > 0 ? "text-rose-400" : diff < 0 ? "text-emerald-400" : "text-slate-400"}`}>
              {diff > 0 ? `+${diff}` : diff} from baseline
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
