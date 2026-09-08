import React, { useState } from "react";
import { 
  Users, MapPin, Send, ThumbsUp, CheckCircle, AlertCircle, 
  CloudRain, Sun, CloudFog, Wind, ShieldAlert, Sparkles 
} from "lucide-react";

interface CitizenReport {
  id: string;
  user: string;
  location: string;
  category: "rain" | "flood" | "fog" | "heat" | "clear";
  headline: string;
  details: string;
  timeAgo: string;
  confirmations: number;
  verified: boolean;
}

interface CitizenWeatherPulseProps {
  cityName: string;
}

const INITIAL_REPORTS: CitizenReport[] = [
  {
    id: "rep-1",
    user: "Aarav S. (Local Commuter)",
    location: "Ring Road Flyover Junction",
    category: "flood",
    headline: "Underpass waterlogged (approx 8-10 inches)",
    details: "Two-wheelers getting stuck in left lane near underpass exit. Diverting via service road recommended.",
    timeAgo: "4 mins ago",
    confirmations: 19,
    verified: true,
  },
  {
    id: "rep-2",
    user: "Priya M. (Resident)",
    location: "Central Market & Sector 18",
    category: "rain",
    headline: "Sudden sharp rain shower started",
    details: "Heavy localized droplets, pavement dampening rapidly. Shop awnings open.",
    timeAgo: "12 mins ago",
    confirmations: 11,
    verified: true,
  },
  {
    id: "rep-3",
    user: "Vikram R. (Delivery Partner)",
    location: "Outer Ring Expressway",
    category: "fog",
    headline: "Dense haze & smoke reducing visibility",
    details: "Keep headlights on low beam. Construction dust combined with low winds.",
    timeAgo: "28 mins ago",
    confirmations: 7,
    verified: false,
  },
];

export const CitizenWeatherPulse: React.FC<CitizenWeatherPulseProps> = ({
  cityName,
}) => {
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [userReportText, setUserReportText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"rain" | "flood" | "fog" | "heat" | "clear">("rain");
  const [hasReported, setHasReported] = useState(false);

  const handleUpvote = (id: string) => {
    setReports((prev) =>
      prev.map((rep) =>
        rep.id === id
          ? { ...rep, confirmations: rep.confirmations + 1, verified: rep.confirmations + 1 >= 10 }
          : rep
      )
    );
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReportText.trim()) return;

    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      user: "You (Verified Citizen)",
      location: `${cityName} (Current Vicinity)`,
      category: selectedCategory,
      headline: userReportText.trim(),
      details: "Reported directly via VyoomDut crowdsourced ground network.",
      timeAgo: "Just now",
      confirmations: 1,
      verified: false,
    };

    setReports([newReport, ...reports]);
    setUserReportText("");
    setHasReported(true);
    setTimeout(() => setHasReported(false), 4000);
  };

  const getCategoryBadge = (cat: CitizenReport["category"]) => {
    switch (cat) {
      case "flood":
        return { label: "Waterlogging", icon: <ShieldAlert className="w-3.5 h-3.5" />, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
      case "rain":
        return { label: "Active Rain", icon: <CloudRain className="w-3.5 h-3.5" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
      case "fog":
        return { label: "Low Visibility", icon: <CloudFog className="w-3.5 h-3.5" />, color: "text-slate-300 bg-slate-500/10 border-slate-500/30" };
      case "heat":
        return { label: "Severe Heat", icon: <Sun className="w-3.5 h-3.5" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
      case "clear":
        return { label: "Clear / Pleasant", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Citizen Weather Pulse — Live Ground Reports
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Crowdsourced Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time hyper-local ground truth reported by residents, drivers, and field sensors in and around {cityName}.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold">{reports.length} Active Observations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Submit Ground Report */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Report Weather Out Your Window</span>
            </h3>

            {hasReported && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Your ground report has been broadcasted to the community network!</span>
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Observation Type
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "rain", label: "Rain / Drizzle", icon: "🌧️" },
                    { id: "flood", label: "Waterlogging", icon: "🌊" },
                    { id: "fog", label: "Dense Fog", icon: "🌫️" },
                    { id: "heat", label: "Heat Wave", icon: "🔥" },
                    { id: "clear", label: "Clear Sky", icon: "☀️" },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`p-2 rounded-xl border text-center transition font-semibold flex items-center justify-center gap-1.5 ${
                        selectedCategory === cat.id
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text note */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Hyper-Local Ground Observation
                </label>
                <textarea
                  rows={3}
                  value={userReportText}
                  onChange={(e) => setUserReportText(e.target.value)}
                  placeholder={`E.g., "Heavy rain near metro station, road slippery" or "Waterlogging on 100 ft road"...`}
                  className="w-full p-3 bg-slate-950 text-sm text-slate-100 rounded-2xl border border-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={!userReportText.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Verified Ground Pulse</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 7 Cols: Live Feed */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-bold uppercase tracking-wider">Live Citizen Stream</span>
            <span>Sorted by Recency & Confirmation</span>
          </div>

          <div className="space-y-3">
            {reports.map((report) => {
              const badge = getCategoryBadge(report.category);
              return (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      {report.verified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Community Verified</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{report.timeAgo}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">
                      {report.headline}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {report.details}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{report.location}</span>
                      <span>•</span>
                      <span className="text-slate-500">{report.user}</span>
                    </div>

                    <button
                      onClick={() => handleUpvote(report.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Confirm ({report.confirmations})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
