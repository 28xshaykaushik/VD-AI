import React, { useState, useMemo } from "react";
import { 
  Calendar, Clock, Users, Sparkles, CheckCircle2, AlertTriangle, 
  Wind, CloudRain, Droplets, Sun, Flame, ShieldAlert, Copy, Check, 
  Layers, Compass, ArrowRight, Music, Trophy, Wine, Coffee, Tent, 
  Building2, Trees, Waves, Eye, Info, RefreshCw
} from "lucide-react";
import { WeatherData, DailyForecast } from "../types";
import { getUITranslation } from "../utils/languages";

interface EventWeatherRiskSimulatorProps {
  weather: WeatherData;
  language: string;
}

type EventType = "wedding" | "sports" | "cocktail" | "poolside" | "concert" | "picnic";
type VenueType = "open_lawn" | "german_hanger" | "terrace" | "poolside" | "courtyard";
type TimeSlot = "morning" | "afternoon" | "evening" | "night";

interface EventTypeOption {
  id: EventType;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
}

const EVENT_TYPES: EventTypeOption[] = [
  {
    id: "wedding",
    label: "Wedding & Sangeet",
    subtitle: "Grand lawn celebrations, heavy ethnic wear, open stage & floral decor",
    icon: Sparkles,
    color: "text-amber-400",
    bgLight: "bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "sports",
    label: "Outdoor Sports & Cricket",
    subtitle: "Pitch traction, ball grip, athlete heat index & rain washout risk",
    icon: Trophy,
    color: "text-emerald-400",
    bgLight: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "cocktail",
    label: "Terrace Gala & Cocktails",
    subtitle: "High-rise rooftop winds, glassware stability, evening chill & skyline view",
    icon: Wine,
    color: "text-purple-400",
    bgLight: "bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "poolside",
    label: "Poolside Sundowner",
    subtitle: "High humidity swelter, wet tile slip hazards, sunset lighting & breeze",
    icon: Waves,
    color: "text-cyan-400",
    bgLight: "bg-cyan-500/10 border-cyan-500/30",
  },
  {
    id: "concert",
    label: "Open-Air Live Concert",
    subtitle: "Audio truss wind load, crowd thermal swelter, electronics water protection",
    icon: Music,
    color: "text-rose-400",
    bgLight: "bg-rose-500/10 border-rose-500/30",
  },
  {
    id: "picnic",
    label: "Garden Brunch & Picnic",
    subtitle: "Lawn mud saturation, direct solar glare, bugs & daytime comfort",
    icon: Coffee,
    color: "text-teal-400",
    bgLight: "bg-teal-500/10 border-teal-500/30",
  },
];

interface VenueOption {
  id: VenueType;
  name: string;
  desc: string;
  icon: React.ElementType;
  rainShieldScore: number; // 0-100
  windSensitivity: "HIGH" | "MEDIUM" | "LOW";
}

const VENUE_TYPES: VenueOption[] = [
  {
    id: "open_lawn",
    name: "Open Grass Lawn",
    desc: "Uncovered natural turf, fully exposed to rain, mud, direct sun & evening dew.",
    icon: Trees,
    rainShieldScore: 10,
    windSensitivity: "MEDIUM",
  },
  {
    id: "german_hanger",
    name: "Waterproof German Hanger",
    desc: "Heavy-duty aluminum frame with tensioned PVC roof, high rain protection, anchored truss.",
    icon: Tent,
    rainShieldScore: 90,
    windSensitivity: "HIGH",
  },
  {
    id: "terrace",
    name: "Rooftop Open Terrace",
    desc: "Elevated structure exposed to accelerated wind shear, gust turbulence, zero tree cover.",
    icon: Building2,
    rainShieldScore: 15,
    windSensitivity: "HIGH",
  },
  {
    id: "poolside",
    name: "Poolside & Tile Deck",
    desc: "Polished tiles prone to condensation slip, localized evaporative humidity.",
    icon: Waves,
    rainShieldScore: 20,
    windSensitivity: "MEDIUM",
  },
  {
    id: "courtyard",
    name: "Walled Courtyard",
    desc: "Masonry windbreak buffer, partial drainage slope, sheltered ambiance.",
    icon: Layers,
    rainShieldScore: 40,
    windSensitivity: "LOW",
  },
];

export const EventWeatherRiskSimulator: React.FC<EventWeatherRiskSimulatorProps> = ({
  weather,
  language,
}) => {
  const [selectedEventType, setSelectedEventType] = useState<EventType>("wedding");
  const [selectedVenue, setSelectedVenue] = useState<VenueType>("open_lawn");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>("evening");
  const [guestScale, setGuestScale] = useState<number>(250);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  // Available daily dates from forecast
  const availableDays = useMemo(() => {
    return weather.daily && weather.daily.length > 0 ? weather.daily : [];
  }, [weather]);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    availableDays[0]?.date || new Date().toISOString().split("T")[0]
  );

  const selectedDayForecast: DailyForecast = useMemo(() => {
    const found = availableDays.find((d) => d.date === selectedDateStr);
    return found || availableDays[0] || {
      day: "Today",
      date: selectedDateStr,
      maxTemp: weather.current.temp + 2,
      minTemp: weather.current.temp - 4,
      pop: weather.current.precipitation > 0 ? 70 : 15,
      precipSum: weather.current.precipitation,
      uvMax: 6,
      sunrise: "06:00",
      sunset: "18:30",
      info: { label: weather.current.condition, icon: "cloud", hazard: weather.current.hazard },
    };
  }, [availableDays, selectedDateStr, weather]);

  // Estimate atmospheric vectors for selected time slot
  const slotAtmospherics = useMemo(() => {
    const maxT = selectedDayForecast.maxTemp;
    const minT = selectedDayForecast.minTemp;
    const basePop = selectedDayForecast.pop;
    const baseWind = weather.current.windSpeed;

    switch (selectedTimeSlot) {
      case "morning":
        return {
          slotLabel: "Morning (07:00 – 11:00)",
          temp: Math.round(minT + (maxT - minT) * 0.35),
          humidity: Math.min(95, weather.current.humidity + 15),
          pop: Math.round(basePop * 0.75),
          windSpeed: Math.round(baseWind * 0.7),
          windGust: Math.round(baseWind * 1.0),
          dewPointRisk: "MODERATE",
          thermalSwelter: "COMFORTABLE",
          lighting: "Crisp natural daylight, prime for photography",
        };
      case "afternoon":
        return {
          slotLabel: "Afternoon (12:00 – 16:00)",
          temp: maxT,
          humidity: Math.max(30, weather.current.humidity - 20),
          pop: Math.round(basePop * 0.9),
          windSpeed: Math.round(baseWind * 1.1),
          windGust: Math.round(baseWind * 1.5),
          dewPointRisk: "NONE",
          thermalSwelter: maxT > 33 ? "EXTREME_HEAT" : maxT > 28 ? "WARM" : "PLEASANT",
          lighting: "Harsh overhead solar radiation, canopy required",
        };
      case "evening":
        return {
          slotLabel: "Golden Hour & Sangeet (16:00 – 20:00)",
          temp: Math.round(maxT - (maxT - minT) * 0.3),
          humidity: weather.current.humidity,
          pop: basePop,
          windSpeed: Math.round(baseWind * 1.25), // Thermal convective breeze
          windGust: Math.round(baseWind * 1.7),
          dewPointRisk: "LOW",
          thermalSwelter: "PRIME_COMFORT",
          lighting: "Golden hour sunset, ideal ambiance for ceremonies",
        };
      case "night":
      default:
        return {
          slotLabel: "Dinner & Late Gala (20:00 – 01:00)",
          temp: Math.round(minT + (maxT - minT) * 0.15),
          humidity: Math.min(98, weather.current.humidity + 20),
          pop: Math.round(basePop * 0.8),
          windSpeed: Math.max(5, Math.round(baseWind * 0.8)),
          windGust: Math.max(8, Math.round(baseWind * 1.1)),
          dewPointRisk: "HIGH",
          thermalSwelter: minT < 15 ? "CHILLY" : "COOL",
          lighting: "Artificial fairy light & wash floods required",
        };
    }
  }, [selectedDayForecast, selectedTimeSlot, weather]);

  // Venue Viability Computation Engine
  const simulationResults = useMemo(() => {
    const venue = VENUE_TYPES.find((v) => v.id === selectedVenue) || VENUE_TYPES[0];
    const event = EVENT_TYPES.find((e) => e.id === selectedEventType) || EVENT_TYPES[0];

    // 1. Rain Disruption Risk
    const effectiveRainVulnerability = (100 - venue.rainShieldScore) / 100;
    const rainScore = Math.max(5, Math.round(100 - slotAtmospherics.pop * effectiveRainVulnerability * 1.2));

    // 2. Wind Structural Threat
    const windMultiplier = venue.windSensitivity === "HIGH" ? 1.4 : venue.windSensitivity === "MEDIUM" ? 1.0 : 0.7;
    const windSpeedHazard = slotAtmospherics.windGust * windMultiplier;
    const windScore = Math.max(10, Math.round(100 - Math.min(90, windSpeedHazard * 2.2)));

    // 3. Thermal Comfort in Event Attire
    let thermalScore = 85;
    if (slotAtmospherics.temp > 35) thermalScore = 40;
    else if (slotAtmospherics.temp > 31) thermalScore = 65;
    else if (slotAtmospherics.temp < 13) thermalScore = 55;
    else thermalScore = 95;

    if (selectedEventType === "wedding" && slotAtmospherics.temp > 30) {
      thermalScore -= 15; // heavy silks & lehengas
    }

    // 4. Dew & Condensation Slip Risk
    let dewScore = 90;
    if (slotAtmospherics.dewPointRisk === "HIGH") {
      if (selectedVenue === "poolside" || selectedVenue === "open_lawn") {
        dewScore = 45;
      } else {
        dewScore = 65;
      }
    }

    // 5. Air Quality & Optical Haze
    const aqi = weather.current.aqi || 85;
    let aqiScore = 95;
    if (aqi > 250) aqiScore = 35;
    else if (aqi > 150) aqiScore = 60;
    else if (aqi > 100) aqiScore = 80;

    // Aggregate Composite Viability Index
    const totalScore = Math.max(
      15,
      Math.min(
        98,
        Math.round(
          rainScore * 0.35 +
          windScore * 0.25 +
          thermalScore * 0.20 +
          dewScore * 0.10 +
          aqiScore * 0.10
        )
      )
    );

    let statusGrade: "PRISTINE" | "FEASIBLE" | "HIGH_RISK" | "INDOOR_MANDATORY";
    let statusTitle = "";
    let statusDesc = "";
    let bannerBg = "";
    let bannerBorder = "";
    let bannerText = "";

    if (totalScore >= 80) {
      statusGrade = "PRISTINE";
      statusTitle = "Pristine Outdoor Conditions";
      statusDesc = "Superb atmospheric alignment. Minimal risk of precipitation or structural wind disruption. Open-air setup fully recommended.";
      bannerBg = "bg-emerald-500/10";
      bannerBorder = "border-emerald-500/30";
      bannerText = "text-emerald-400";
    } else if (totalScore >= 62) {
      statusGrade = "FEASIBLE";
      statusTitle = "Feasible with Active Mitigations";
      statusDesc = "Outdoor setup is viable, but protective measures (rainproof marquis, ballast weights, cooling/heating fans) are strictly advised.";
      bannerBg = "bg-cyan-500/10";
      bannerBorder = "border-cyan-500/30";
      bannerText = "text-cyan-300";
    } else if (totalScore >= 45) {
      statusGrade = "HIGH_RISK";
      statusTitle = "High Weather Sensitivity";
      statusDesc = "Elevated weather hazard. High likelihood of guest discomfort, floral damage, or rain penetration. Keep an indoor banquet transition ready on 2-hour standby.";
      bannerBg = "bg-amber-500/10";
      bannerBorder = "border-amber-500/30";
      bannerText = "text-amber-400";
    } else {
      statusGrade = "INDOOR_MANDATORY";
      statusTitle = "Critical Atmospheric Hazard — Move Indoors";
      statusDesc = "Severe risk of rain washout, structural wind collapse, or extreme thermal discomfort. Moving the ceremony indoors is strongly advised.";
      bannerBg = "bg-rose-500/10";
      bannerBorder = "border-rose-500/30";
      bannerText = "text-rose-400";
    }

    // Vectors detail
    const vectors = [
      {
        id: "rain",
        name: "Rain & Downpour Ingress",
        score: rainScore,
        metricDisplay: `${slotAtmospherics.pop}% Chance • ${selectedDayForecast.precipSum} mm`,
        riskLevel: rainScore > 75 ? "LOW" : rainScore > 50 ? "MODERATE" : "HIGH",
        advice:
          rainScore > 75
            ? "Negligible precipitation danger. Open sky staging is secure."
            : venue.id === "german_hanger"
            ? "Covered canopy will deflect showers, but ensure side gutter channels are installed."
            : "High rain probability. Uncovered lawn will turn muddy; install elevated duckboards.",
        mitigation:
          venue.id === "open_lawn"
            ? "Keep waterproof transparent tarpaulin roll-downs ready on perimeter trusses."
            : "Ensure German Hanger seams have heat-welded tape and clear drainage gutters.",
      },
      {
        id: "wind",
        name: "Wind Gust & Structural Shear",
        score: windScore,
        metricDisplay: `${slotAtmospherics.windSpeed} km/h base • ${slotAtmospherics.windGust} km/h gusts`,
        riskLevel: windScore > 75 ? "LOW" : windScore > 50 ? "MODERATE" : "HIGH",
        advice:
          slotAtmospherics.windGust > 30
            ? "Dangerous wind gusts! High risk to floral mandaps, tall LED backdrops, and buffet burners."
            : "Manageable breeze. Standard sound rigging and floral weighting are sufficient.",
        mitigation:
          "Anchor tent legs with concrete/water ballasts (min 150 kg per leg). Lock buffet chafing flames with wind-guards.",
      },
      {
        id: "thermal",
        name: "Guest Attire Thermal Comfort",
        score: thermalScore,
        metricDisplay: `${slotAtmospherics.temp}°C ambient • ${slotAtmospherics.thermalSwelter}`,
        riskLevel: thermalScore > 75 ? "LOW" : thermalScore > 50 ? "MODERATE" : "HIGH",
        advice:
          slotAtmospherics.temp > 32
            ? "Guests in heavy silk lehengas or suits will face sweat fatigue within 30 minutes."
            : slotAtmospherics.temp < 16
            ? "Evening chill will cause guest shivering once the sun sets."
            : "Comfortable ambient temperatures for outdoor celebration.",
        mitigation:
          slotAtmospherics.temp > 30
            ? "Deploy 6–8 outdoor misting fans or localized ducted AC chillers near the main seating."
            : slotAtmospherics.temp < 18
            ? "Position infrared patio heaters every 15 feet along dining and lounge areas."
            : "Provide standard ceiling fans or ambient air circulators.",
      },
      {
        id: "dew",
        name: "Dew & Condensation Risk",
        score: dewScore,
        metricDisplay: `Risk: ${slotAtmospherics.dewPointRisk} • RH ${slotAtmospherics.humidity}%`,
        riskLevel: dewScore > 75 ? "LOW" : dewScore > 50 ? "MODERATE" : "HIGH",
        advice:
          slotAtmospherics.dewPointRisk === "HIGH"
            ? "Heavy night dew will moisten guest chair cushions, stage steps, and slick marble tiles."
            : "Minimal dew accumulation during selected hours.",
        mitigation:
          "Keep dry microfiber wipes with catering crew; apply non-slip rubber runners on stage ramps and dance floors.",
      },
      {
        id: "optical",
        name: "Photography & Air Quality",
        score: aqiScore,
        metricDisplay: `AQI ${aqi} • ${slotAtmospherics.lighting.split(",")[0]}`,
        riskLevel: aqiScore > 75 ? "LOW" : aqiScore > 50 ? "MODERATE" : "HIGH",
        advice:
          aqi > 200
            ? "Heavy particulate haze will soften drone aerial cinematography and sunset light contrast."
            : "Clear optical visibility for high-definition photography and drone tracking.",
        mitigation:
          "Schedule main portrait and couple photography session during the golden hour window before ambient dust settles.",
      },
    ];

    // Hardware Production Checklist
    const productionChecklist = [
      {
        item: "Raised Wooden Sub-Flooring",
        needed: venue.id === "open_lawn" && slotAtmospherics.pop > 20,
        desc: "Prevents high heels from sinking into damp turf and isolates ground moisture.",
      },
      {
        item: "German Hanger Heavy Ballasts",
        needed: venue.id === "german_hanger" || slotAtmospherics.windGust > 20,
        desc: "Min 150 kg per upright pillar to resist wind uplift shear.",
      },
      {
        item: "Chafing Fuel Wind Shields",
        needed: slotAtmospherics.windSpeed > 14,
        desc: "Prevents buffet burners from blowing out and uneven food cooling.",
      },
      {
        item: "Industrial Evaporative Misters",
        needed: slotAtmospherics.temp > 29,
        desc: "Reduces perceived ambient microclimate temperature by 4–6°C for dining guests.",
      },
      {
        item: "Infrared Patio Tower Heaters",
        needed: slotAtmospherics.temp < 18,
        desc: "Radiant spot heating for elderly guests and bridal lounge seating.",
      },
      {
        item: "Silent Backup Diesel Genset (125 kVA)",
        needed: true,
        desc: "Uninterruptible power backup for lighting truss and sound systems in case of thunderstorm grid tripping.",
      },
    ];

    // Plan B Trigger Triggers
    const contingencyTriggers = [
      `Rain Radar Trigger: If Doppler reflectivity radar detects a storm cell within 20 km of ${weather.location.name}, initiate Plan B indoor foyer transition immediately.`,
      `Wind Gust Threshold: If sustained ground wind passes 32 km/h, lower overhead floral lighting trusses and dismantle lightweight decorative foam backdrops.`,
      `Dew & Moisture Cutoff: At 21:30, transition open-lawn dining into the covered marquee to protect banquet cutlery and guest apparel from heavy dew.`,
    ];

    return {
      totalScore,
      statusGrade,
      statusTitle,
      statusDesc,
      bannerBg,
      bannerBorder,
      bannerText,
      vectors,
      productionChecklist,
      contingencyTriggers,
      venue,
      event,
    };
  }, [selectedVenue, selectedEventType, slotAtmospherics, selectedDayForecast, weather]);

  // 14-Day Smart Alternative Date Matrix
  const alternativeSlots = useMemo(() => {
    return availableDays.map((d, index) => {
      const isWeekend = d.day === "Saturday" || d.day === "Sunday";
      let dayScore = 92;

      // Penalize rain
      dayScore -= Math.round((d.pop / 100) * 45);
      if (d.precipSum > 5) dayScore -= 20;

      // Penalize extreme temp
      if (d.maxTemp > 36) dayScore -= 25;
      else if (d.maxTemp < 14) dayScore -= 15;

      const boundedScore = Math.max(20, Math.min(98, dayScore));
      const verdict = boundedScore >= 80 ? "OPTIMAL" : boundedScore >= 60 ? "FEASIBLE" : "RISKY";

      return {
        date: d.date,
        dayLabel: index === 0 ? "Today" : index === 1 ? "Tomorrow" : d.day,
        isWeekend,
        score: boundedScore,
        condition: d.info?.label || "Clear",
        temp: d.maxTemp,
        rainPop: d.pop,
        windSpeed: Math.round(weather.current.windSpeed * (0.8 + (index % 3) * 0.2)),
        verdict,
        highlight:
          index === 0
            ? "Current Selection"
            : isWeekend && boundedScore > 80
            ? "Top Weekend Slot ⭐"
            : boundedScore > 85
            ? "Clear & Dry Golden Window"
            : undefined,
      };
    });
  }, [availableDays, weather]);

  const bestWeekendSlot = useMemo(() => {
    return alternativeSlots.find((s) => s.isWeekend && s.score >= 75) || alternativeSlots[0];
  }, [alternativeSlots]);

  // Copy contingency briefing text
  const handleCopyBrief = () => {
    const brief = `📋 [VYOOMDUT AI — EVENT & WEDDING WEATHER RISK BRIEF]
Location: ${weather.location.name}, ${weather.location.country}
Event Type: ${simulationResults.event.label} (${guestScale} Expected Guests)
Venue: ${simulationResults.venue.name}
Date & Window: ${selectedDayForecast.day}, ${selectedDateStr} (${slotAtmospherics.slotLabel})

Overall Venue Viability Score: ${simulationResults.totalScore}/100 (${simulationResults.statusTitle})
Atmospheric Forecast: ${slotAtmospherics.temp}°C, Rain Chance ${slotAtmospherics.pop}%, Wind Gusts ${slotAtmospherics.windGust} km/h, AQI ${weather.current.aqi}

CRITICAL DISRUPTION VECTORS:
1. Rain Ingress: ${simulationResults.vectors[0].score}/100 (${simulationResults.vectors[0].metricDisplay})
2. Wind Stability: ${simulationResults.vectors[1].score}/100 (${simulationResults.vectors[1].metricDisplay})
3. Guest Attire Comfort: ${simulationResults.vectors[2].score}/100 (${simulationResults.vectors[2].metricDisplay})
4. Dew & Condensation: ${simulationResults.vectors[3].score}/100 (${simulationResults.vectors[3].metricDisplay})

PRODUCTION HARDWARE CHECKLIST:
${simulationResults.productionChecklist
  .filter((c) => c.needed)
  .map((c) => `• [REQUIRED] ${c.item}: ${c.desc}`)
  .join("\n")}

CONTINGENCY SHIFT PROTOCOLS (PLAN B):
${simulationResults.contingencyTriggers.map((t, i) => `${i + 1}. ${t}`).join("\n")}

SMART ALTERNATIVE DATE RECOMMENDATION:
Top Alternative Slot: ${bestWeekendSlot.dayLabel} (${bestWeekendSlot.date}) with Viability Score ${bestWeekendSlot.score}/100 (${bestWeekendSlot.condition}, ${bestWeekendSlot.rainPop}% Rain Risk).

Generated by VyoomDut AI • Atmospheric Intelligence Suite`;

    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Atmospheric Event Risk Simulator
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                14-Day Horizon
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Event & Wedding Weather Viability Simulator
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Eliminate weather guesswork for weddings, outdoor sports, terrace galas, and poolside banquets in{" "}
              <span className="text-amber-300 font-semibold">{weather.location.name}</span>. Calculate structural wind shear, rain penetration, attire thermal comfort, and alternative dry dates.
            </p>
          </div>

          <button
            onClick={handleCopyBrief}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 shrink-0 self-start md:self-auto shadow-md"
          >
            {copiedBrief ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Brief Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Export Contingency Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Type & Venue Archetype */}
        <div className="lg:col-span-1 space-y-4">
          {/* Step 1: Event Type */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1. Select Event Archetype
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((ev) => {
                const Icon = ev.icon;
                const isSelected = selectedEventType === ev.id;
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEventType(ev.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `${ev.bgLight} shadow-md`
                        : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isSelected ? ev.color : "text-slate-400"}`} />
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {ev.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {ev.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Venue Physical Archetype */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                2. Venue Physical Archetype
              </span>
            </div>

            <div className="space-y-2">
              {VENUE_TYPES.map((v) => {
                const Icon = v.icon;
                const isSelected = selectedVenue === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVenue(v.id)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/40 text-white shadow-sm"
                        : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{v.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{v.desc}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {v.rainShieldScore}% Rain Shield
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Timing, Scale & Viability Result */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 3: Date, Time & Guest Scale */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              3. Date, Time Window & Scale
            </span>

            {/* Quick Date Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Date</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {availableDays.slice(0, 7).map((day, i) => {
                  const isSelected = selectedDateStr === day.date;
                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDateStr(day.date)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex flex-col items-center shrink-0 min-w-[76px] ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                          : "bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300"
                      }`}
                    >
                      <span className="text-[10px] opacity-80 uppercase">
                        {i === 0 ? "Today" : i === 1 ? "Tomorrow" : day.day.slice(0, 3)}
                      </span>
                      <span className="text-sm font-black">{day.date.split("-").slice(1).join("/")}</span>
                      <span className="text-[10px] mt-0.5 font-normal">{day.maxTemp}°C</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot & Guest Slider Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Time Slots */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Time of Day Slot
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: "morning", label: "Morning", sub: "07:00 – 11:00" },
                      { id: "afternoon", label: "Afternoon", sub: "12:00 – 16:00" },
                      { id: "evening", label: "Evening / Sangeet", sub: "16:00 – 20:00" },
                      { id: "night", label: "Dinner / Gala", sub: "20:00 – 01:00" },
                    ] as const
                  ).map((slot) => {
                    const isSelected = selectedTimeSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedTimeSlot(slot.id)}
                        className={`p-2 rounded-xl border text-left transition ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400/60 text-white"
                            : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-200">{slot.label}</div>
                        <div className="text-[10px] text-slate-500">{slot.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guest Scale */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-400" />
                    Expected Guest Count
                  </label>
                  <span className="text-xs font-black text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    {guestScale} Guests
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="1000"
                  step="25"
                  value={guestScale}
                  onChange={(e) => setGuestScale(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Intimate (50)</span>
                  <span>Grand Lawn (250)</span>
                  <span>Mega Gala (1000+)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Viability Index Hero Card */}
          <div
            className={`p-6 rounded-2xl border transition-all duration-300 ${simulationResults.bannerBg} ${simulationResults.bannerBorder}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                    Calculated Viability Index
                  </span>
                  <span className={`text-xs font-bold ${simulationResults.bannerText}`}>
                    {simulationResults.statusGrade.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {simulationResults.statusTitle}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  {simulationResults.statusDesc}
                </p>
              </div>

              {/* Circular Viability Metric */}
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-slate-950/80 border-2 border-slate-800 shadow-inner">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white leading-none">
                      {simulationResults.totalScore}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">
                      / 100
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Atmospheric Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Window Temp</span>
                <span className="font-black text-white">{slotAtmospherics.temp}°C</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rain Ingress</span>
                <span className="font-black text-cyan-300">{slotAtmospherics.pop}% chance</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Wind Shear</span>
                <span className="font-black text-amber-300">{slotAtmospherics.windGust} km/h gusts</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Air Quality</span>
                <span className="font-black text-emerald-300">AQI {weather.current.aqi}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disruption Vectors Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Detailed Atmospheric Disruption Vectors
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              5-dimensional engineering evaluation for event producers, decorators, and caterers
            </p>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline">
            Higher score = Safer condition
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {simulationResults.vectors.map((vec) => {
            const riskBadge =
              vec.riskLevel === "LOW"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : vec.riskLevel === "MODERATE"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/30";

            return (
              <div
                key={vec.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{vec.name}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${riskBadge}`}>
                      {vec.riskLevel}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-cyan-400 mb-2">
                    {vec.metricDisplay}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        vec.score > 75 ? "bg-emerald-500" : vec.score > 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${vec.score}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {vec.advice}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-amber-300/90 font-medium">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Mitigation:
                  </span>
                  {vec.mitigation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Hardware & Contingency Protocols Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Production & Staging Gear */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tent className="w-4 h-4 text-cyan-400" />
              Production Hardware & Staging Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Infrastructure checklist calibrated to current venue & weather vectors
            </p>
          </div>

          <div className="space-y-2">
            {simulationResults.productionChecklist.map((c, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                  c.needed
                    ? "bg-cyan-500/10 border-cyan-500/30 text-slate-200"
                    : "bg-slate-950/40 border-slate-800/60 text-slate-400 opacity-60"
                }`}
              >
                <div className="mt-0.5">
                  {c.needed ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {c.item}
                    {c.needed && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        Essential
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan B Contingency Shift Protocols */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Plan B Contingency & Shift Protocols
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contractual decision triggers for event planners, sound engineers & catering
            </p>
          </div>

          <div className="space-y-2.5">
            {simulationResults.contingencyTriggers.map((trig, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{trig}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
            <span className="font-bold block mb-1">Contractual Weather Clause Recommendation:</span>
            Ensure outdoor event vendor contracts include a 2-hour transition window without financial penalty if sustained wind exceeds 30 km/h or rain radar confirms downpour ingress.
          </div>
        </div>
      </div>

      {/* 14-Day Alternative Date Finder */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Compass className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">
                14-Day Alternative Date & Weekend Finder
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative atmospheric matrix scanning upcoming dates for the lowest precipitation and calmest winds
            </p>
          </div>

          {bestWeekendSlot && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended: <strong>{bestWeekendSlot.dayLabel} ({bestWeekendSlot.date})</strong> • {bestWeekendSlot.score}/100</span>
            </div>
          )}
        </div>

        {/* Alternative Day Cards Horizontal Reel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {alternativeSlots.map((slot) => {
            const isSelected = selectedDateStr === slot.date;
            const scoreColor =
              slot.score >= 80
                ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                : slot.score >= 60
                ? "text-cyan-400 border-cyan-500/40 bg-cyan-500/10"
                : "text-rose-400 border-rose-500/40 bg-rose-500/10";

            return (
              <div
                key={slot.date}
                onClick={() => setSelectedDateStr(slot.date)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between group ${
                  isSelected
                    ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                    : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] uppercase font-bold ${slot.isWeekend ? "text-amber-400" : "text-slate-400"}`}>
                      {slot.dayLabel}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${scoreColor}`}>
                      {slot.score}%
                    </span>
                  </div>

                  <div className="text-xs font-black text-white">
                    {slot.date.split("-").slice(1).join("/")}
                  </div>

                  <div className="text-[11px] text-slate-300 mt-1 truncate">
                    {slot.condition}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Rain:</span>
                    <span className={slot.rainPop > 40 ? "text-rose-400 font-bold" : "text-slate-200"}>
                      {slot.rainPop}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Temp:</span>
                    <span className="text-slate-200">{slot.temp}°C</span>
                  </div>
                  {slot.highlight && (
                    <div className="text-[9px] font-bold text-emerald-300 mt-1 truncate">
                      {slot.highlight}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
