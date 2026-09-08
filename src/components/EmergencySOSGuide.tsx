import React, { useState } from "react";
import { 
  AlertOctagon, 
  PhoneCall, 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Share2, 
  LifeBuoy, 
  MapPin, 
  Zap, 
  FileText, 
  HeartHandshake,
  AlertTriangle
} from "lucide-react";
import { WeatherData } from "../types";

interface EmergencySOSGuideProps {
  weatherData: WeatherData;
  language: string;
}

interface ChecklistItem {
  id: string;
  category: "hydration" | "power" | "documents" | "medical" | "safety";
  label: string;
  description: string;
  checked: boolean;
}

export const EmergencySOSGuide: React.FC<EmergencySOSGuideProps> = ({ weatherData, language }) => {
  const [copiedBeacon, setCopiedBeacon] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "c1",
      category: "hydration",
      label: "3-Day Potable Water Supply",
      description: "At least 3 liters of sealed drinking water per person per day with water purification tablets.",
      checked: true,
    },
    {
      id: "c2",
      category: "power",
      label: "High-Capacity Power Bank & Emergency Torch",
      description: "Fully charged 20,000mAh battery pack, extra cables, and a water-resistant LED flashlight.",
      checked: true,
    },
    {
      id: "c3",
      category: "documents",
      label: "Waterproof Vital Document Pouch",
      description: "Aadhaar, passport, property/vehicle papers, and medical records wrapped in airtight zip-locks.",
      checked: false,
    },
    {
      id: "c4",
      category: "medical",
      label: "First Aid Kit & Critical Medications",
      description: "Antiseptic wipes, bandages, pain relievers, ORS rehydration sachets, and 7-day personal prescriptions.",
      checked: true,
    },
    {
      id: "c5",
      category: "safety",
      label: "Acoustic Whistle & Thermal Blanket",
      description: "High-decibel emergency whistle for rescue locator signals and reflective foil thermal sheet.",
      checked: false,
    },
    {
      id: "c6",
      category: "safety",
      label: "Dry Rations & Energy Bars",
      description: "Ready-to-eat dry fruits, roasted chana, biscuits, and glucose bars requiring zero cooking.",
      checked: false,
    },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const loc = weatherData.location.name;
  const lat = weatherData.location.lat;
  const lon = weatherData.location.lon;
  const currentTemp = weatherData.current.temp;
  const wind = weatherData.current.windSpeed;
  const aqi = weatherData.current.aqi;
  const alertTitle = weatherData.disasterRisk.alertTitle;
  const alertLevel = weatherData.disasterRisk.alertLevel;

  const generateBeaconMessage = () => {
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    return `🚨 [EMERGENCY SOS WEATHER BEACON - VYOOMDUT]
Location: ${loc} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)
Timestamp: ${timestamp}
Current Weather Status: ${currentTemp}°C, Wind ${wind} km/h, AQI ${aqi}
Active Alert: ${alertLevel} - ${alertTitle}
Kit Readiness: ${checklist.filter((c) => c.checked).length}/${checklist.length} Essentials Packed.
Status: Seeking immediate safety / Emergency alert active. Please notify local disaster authorities if unreachable.`;
  };

  const handleCopyBeacon = () => {
    navigator.clipboard.writeText(generateBeaconMessage());
    setCopiedBeacon(true);
    setTimeout(() => setCopiedBeacon(false), 2500);
  };

  const emergencyHelplines = [
    {
      number: "112",
      title: "National Emergency Service",
      subtitle: "Police, Fire & Medical Unified Response",
      color: "border-rose-500/40 bg-rose-950/30 text-rose-300",
    },
    {
      number: "1070",
      title: "National Disaster Relief (NDMA)",
      subtitle: "Flood, Cyclone, Landslide & Rescue Ops",
      color: "border-amber-500/40 bg-amber-950/30 text-amber-300",
    },
    {
      number: "1077",
      title: "District Disaster Control (DEOC)",
      subtitle: "Local Administration & Relief Shelters",
      color: "border-cyan-500/40 bg-cyan-950/30 text-cyan-300",
    },
    {
      number: "108",
      title: "Disaster Ambulance Helpline",
      subtitle: "Trauma Care & Medical Evacuation",
      color: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
    },
    {
      number: "1912",
      title: "Electricity Board Emergency",
      subtitle: "Report Fallen Wires, Sparks & Short-Circuits",
      color: "border-purple-500/40 bg-purple-950/30 text-purple-300",
    },
    {
      number: "1073",
      title: "National Highway Emergency",
      subtitle: "Highway Patrol & Roadway Blockage Rescue",
      color: "border-blue-500/40 bg-blue-950/30 text-blue-300",
    },
  ];

  const packedCount = checklist.filter((c) => c.checked).length;
  const packedPct = Math.round((packedCount / checklist.length) * 100);

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Extreme Weather SOS & Civil Emergency Center
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                Civil Defense Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active disaster helplines, rapid offline grab-and-go kit checklist, and 1-click GPS distress beacon
            </p>
          </div>
        </div>

        {/* 1-Click SOS Beacon Generator Button */}
        <button
          onClick={handleCopyBeacon}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition shrink-0"
        >
          {copiedBeacon ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedBeacon ? "SOS Beacon Copied!" : "Copy SOS Distress Beacon"}</span>
        </button>
      </div>

      {/* Emergency Helplines Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>National Emergency Direct Helplines (24x7 Toll-Free)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Tap number to dial</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {emergencyHelplines.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className={`p-3.5 rounded-2xl border transition hover:scale-[1.02] flex items-center justify-between gap-3 ${item.color}`}
            >
              <div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</div>
              </div>
              <div className="text-lg font-mono font-black shrink-0 px-2 py-1 rounded-xl bg-slate-950/60 border border-current">
                {item.number}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Two Columns: Offline Survival Checklist + Active Advisory Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: 72-Hour Survival Kit Checklist */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>72-Hour Grab-and-Go Emergency Kit</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure these items are packed in a waterproof backpack before evacuation
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {packedCount}/{checklist.length} ({packedPct}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                packedPct === 100
                  ? "bg-emerald-400"
                  : packedPct >= 50
                  ? "bg-cyan-400"
                  : "bg-amber-400"
              }`}
              style={{ width: `${packedPct}%` }}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  item.checked
                    ? "bg-slate-900/90 border-slate-700/80 text-slate-300"
                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700"
                }`}
              >
                <button className="mt-0.5 shrink-0 text-cyan-400">
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <div className="flex-1">
                  <div
                    className={`text-xs font-bold ${
                      item.checked ? "text-white line-through opacity-75" : "text-slate-200"
                    }`}
                  >
                    {item.label}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Disaster Safety Protocols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Real-Time Evacuation & Shelter Protocols</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <strong className="text-white block mb-1">🌊 Urban Flood / Waterlogging:</strong>
                Never drive or walk through moving water over 6 inches deep. Keep main electricity circuit breaker OFF if water enters ground floor.
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <strong className="text-white block mb-1">⚡ Lightning & Thunder Squalls:</strong>
                Follow the 30/30 rule. Unplug sensitive electrical appliances. Avoid metal poles, tall solitary trees, and open balconies.
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <strong className="text-white block mb-1">🏔️ Mountain & Landslide Slope:</strong>
                Stay away from steep downhill drainages and rock faces during persistent rain. Listen for tree cracking sounds or sudden muddy stream surges.
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <strong className="text-white block mb-1">☀️ Extreme Heat & Sunstroke:</strong>
                Drink water infused with lemon or ORS every 45 minutes even without thirst. Rest in shaded, ventilated zones between 12:00 PM and 3:30 PM.
              </div>
            </div>
          </div>

          {/* Quick Beacon Preview */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between text-rose-300 font-bold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                GPS Distress Beacon
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono line-clamp-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              {generateBeaconMessage()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
