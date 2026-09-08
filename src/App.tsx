import React, { useState, useEffect } from "react";
import { 
  Sparkles, RefreshCw, AlertTriangle, ShieldCheck, MapPin, 
  MessageSquare, Luggage, Navigation, Compass, Layers, CheckCircle2,
  Sliders, Users, Radio, Headphones, AlertOctagon, Globe, Calendar
} from "lucide-react";
import { WeatherData } from "./types";
import { Header } from "./components/Header";
import { HeroWeatherCard } from "./components/HeroWeatherCard";
import { WeatherMissionMode } from "./components/WeatherMissionMode";
import { WeatherAwareRoute } from "./components/WeatherAwareRoute";
import { ShowMeYourBagModal } from "./components/ShowMeYourBagModal";
import { DisasterRiskRadar } from "./components/DisasterRiskRadar";
import { WeatherIntelligencePanels } from "./components/WeatherIntelligencePanels";
import { HomeActionsAndDeparture } from "./components/HomeActionsAndDeparture";
import { ConversationalWeatherGPT } from "./components/ConversationalWeatherGPT";
import { AtmosphericSandbox } from "./components/AtmosphericSandbox";
import { CitizenWeatherPulse } from "./components/CitizenWeatherPulse";
import { RainRadarMap } from "./components/RainRadarMap";
import { DailyAudioBulletin } from "./components/DailyAudioBulletin";
import { EmergencySOSGuide } from "./components/EmergencySOSGuide";
import { EventWeatherRiskSimulator } from "./components/EventWeatherRiskSimulator";
import { LanguageSelectorModal } from "./components/LanguageSelectorModal";
import { getUITranslation, getLanguage } from "./utils/languages";

export default function App() {
  const [currentCity, setCurrentCity] = useState<string>("Delhi");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("English");
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Modals & Panels
  const [isBagModalOpen, setIsBagModalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);

  // Active view section tab
  const [activeSection, setActiveSection] = useState<
    "mission" | "radar" | "audio" | "event" | "sos" | "sandbox" | "citizen" | "route" | "disaster" | "dna" | "departure"
  >("mission");

  // Fetch real-time weather
  const fetchWeather = async (city?: string, lat?: number, lon?: number) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let queryParam = "";
      if (lat !== undefined && lon !== undefined) {
        queryParam = `lat=${lat}&lon=${lon}&city=${encodeURIComponent(city || "My Location")}`;
      } else {
        queryParam = `city=${encodeURIComponent(city || currentCity)}`;
      }

      const res = await fetch(`/api/weather?${queryParam}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: Failed to load weather intelligence`);
      }
      const data = await res.json();
      setWeatherData(data);
      if (data.location?.name) {
        setCurrentCity(data.location.name);
      }
    } catch (err: any) {
      console.error("Error fetching weather:", err);
      setFetchError(err.message || "Failed to connect to weather service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("Delhi");
  }, []);

  // GPS Geolocation Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather("GPS Location", latitude, longitude).then(() => {
          setIsLocating(false);
        });
      },
      (err) => {
        console.warn("Geolocation denied or unavailable:", err);
        setIsLocating(false);
        fetchWeather("Delhi");
      },
      { timeout: 8000 }
    );
  };

  const handleCitySearch = (newCity: string) => {
    setCurrentCity(newCity);
    fetchWeather(newCity);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Global Navigation Header */}
      <Header
        currentCity={weatherData?.location?.name || currentCity}
        currentCondition={weatherData?.current?.condition}
        onSearch={handleCitySearch}
        onLocateMe={handleLocateMe}
        selectedLanguage={language}
        onLanguageChange={setLanguage}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onOpenBagModal={() => setIsBagModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        isLocating={isLocating}
      />

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {isLoading && !weatherData ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Synthesizing Atmospheric Decision Models...
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fetching satellite radar, multi-model consensus, and disaster risk indicators for {currentCity}.
              </p>
            </div>
          </div>
        ) : weatherData ? (
          <>
            {/* Top Weather Hero Card */}
            <HeroWeatherCard
              weather={weatherData}
              onOpenDepartureMode={() => setActiveSection("departure")}
            />

            {/* Smart Navigation Selector */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveSection("mission")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "mission"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{getUITranslation("missionMode", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("radar")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "radar"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>{getUITranslation("radarMap", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("audio")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "audio"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>{getUITranslation("audioBulletin", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("event")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "event"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800"
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{getUITranslation("eventSimulator", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("sos")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "sos"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800"
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>{getUITranslation("emergencySOS", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("sandbox")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "sandbox"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>{getUITranslation("sandbox", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("citizen")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "citizen"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{getUITranslation("citizenPulse", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("route")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "route"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{getUITranslation("routeCorridor", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("disaster")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "disaster"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{getUITranslation("disasterRadar", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("dna")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "dna"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>{getUITranslation("weatherDNA", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("departure")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "departure"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{getUITranslation("departure", language)}</span>
                </button>
              </div>

              {/* Live refresh trigger */}
              <button
                onClick={() => fetchWeather(currentCity)}
                disabled={isLoading}
                title="Refresh Live Data"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 shrink-0 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>

            {/* Active Content Module */}
            <div className="transition-all duration-300">
              {activeSection === "mission" && (
                <WeatherMissionMode
                  weather={weatherData}
                  language={language}
                  onOpenBagModal={() => setIsBagModalOpen(true)}
                />
              )}

              {activeSection === "radar" && (
                <RainRadarMap
                  location={weatherData.location}
                  current={weatherData.current}
                />
              )}

              {activeSection === "audio" && (
                <DailyAudioBulletin
                  weatherData={weatherData}
                  language={language}
                />
              )}

              {activeSection === "event" && (
                <EventWeatherRiskSimulator
                  weather={weatherData}
                  language={language}
                />
              )}

              {activeSection === "sos" && (
                <EmergencySOSGuide
                  weatherData={weatherData}
                  language={language}
                />
              )}

              {activeSection === "sandbox" && (
                <AtmosphericSandbox currentWeather={weatherData} />
              )}

              {activeSection === "citizen" && (
                <CitizenWeatherPulse cityName={weatherData.location.name} />
              )}

              {activeSection === "route" && (
                <WeatherAwareRoute currentCity={weatherData.location.name} />
              )}

              {activeSection === "disaster" && (
                <DisasterRiskRadar
                  disasterRisk={weatherData.disasterRisk}
                  locationName={weatherData.location.name}
                />
              )}

              {activeSection === "dna" && (
                <WeatherIntelligencePanels
                  dna={weatherData.dna}
                  modelEnsemble={weatherData.modelEnsemble}
                  cityName={weatherData.location.name}
                  currentWeather={weatherData.current}
                />
              )}

              {activeSection === "departure" && (
                <HomeActionsAndDeparture weather={weatherData} />
              )}
            </div>

            {/* Quick Overview Bento Grid of Other Modules */}
            <div className="pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Full Decision Intelligence Suite
                </h3>
                <span className="text-xs text-slate-500">VyoomDut AI • Real-Time Decision Suite</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1: Rain Radar */}
                <div
                  onClick={() => setActiveSection("radar")}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-300">
                      Live Doppler
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      Doppler Rain & Storm Radar
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Real-time interactive radar sweep, storm cell trajectories, and wind vector streamlines.
                    </p>
                  </div>
                </div>

                {/* Card 2: Audio Bulletin */}
                <div
                  onClick={() => setActiveSection("audio")}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Headphones className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-300">
                      Speech Audio
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                      Daily AI Audio Bulletin
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Morning & evening radio-style synthesized voice briefing in 22+ Indian languages.
                    </p>
                  </div>
                </div>

                {/* Card 3: Emergency & SOS */}
                <div
                  onClick={() => setActiveSection("sos")}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <AlertOctagon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-rose-300">
                      Civil Defense
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition">
                      Emergency SOS & Survival Kit
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      72-hour survival checklist, distress GPS transmitter, and disaster helplines.
                    </p>
                  </div>
                </div>

                {/* Card 4: Bag Vision AI */}
                <div
                  onClick={() => setIsBagModalOpen(true)}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Luggage className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-300">
                      Vision Scan
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      “Show Me Your Bag” AI
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload bag photo to detect gear and verify rain & climate protection.
                    </p>
                  </div>
                </div>

                {/* Card 5: Atmospheric Sandbox */}
                <div
                  onClick={() => setActiveSection("sandbox")}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Sliders className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-300">
                      Simulator
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      Atmospheric Sandbox
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Tweak rain, temperature, and wind to test AI decision protocols.
                    </p>
                  </div>
                </div>

                {/* Card 6: Citizen Ground Pulse */}
                <div
                  onClick={() => setActiveSection("citizen")}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Users className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-300">
                      Ground Truth
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                      Citizen Weather Pulse
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Crowdsourced live reports on waterlogging, rain, and haze.
                    </p>
                  </div>
                </div>

                {/* Card 7: Event & Wedding Risk Simulator */}
                <div
                  onClick={() => setActiveSection("event")}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-300">
                      14-Day Planner
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                      Event & Wedding Weather Risk
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Simulate lawn, terrace, and poolside viability with alternative dry dates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : fetchError ? (
          <div className="py-20 max-w-lg mx-auto text-center bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Weather Data Connection Issue</h3>
              <p className="text-xs text-slate-400 mt-2">
                {fetchError}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                If newly deployed on Render, ensure the Web Service has booted and the server is listening.
              </p>
            </div>
            <button
              onClick={() => fetchWeather(currentCity)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Atmospheric Sync</span>
            </button>
          </div>
        ) : null}
      </main>

      {/* 3. Floating Quick Action Bar */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5">
        <button
          onClick={() => setIsBagModalOpen(true)}
          className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition flex items-center gap-2 text-xs font-bold"
          title="Scan Bag with Computer Vision"
        >
          <Luggage className="w-4 h-4" />
          <span className="hidden sm:inline">Show Bag AI</span>
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-xl shadow-cyan-500/30 transition flex items-center gap-2 text-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask VyoomDut AI</span>
        </button>
      </div>

      {/* 4. Modals & Drawers */}
      {weatherData && (
        <>
          <ShowMeYourBagModal
            isOpen={isBagModalOpen}
            onClose={() => setIsBagModalOpen(false)}
            weather={weatherData}
          />

          <ConversationalWeatherGPT
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            weather={weatherData}
            language={language}
          />

          <LanguageSelectorModal
            isOpen={isLanguageModalOpen}
            onClose={() => setIsLanguageModalOpen(false)}
            selectedLanguage={language}
            onSelectLanguage={(newLang) => setLanguage(newLang)}
          />
        </>
      )}

      {/* 5. Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">VyoomDut AI</span>
            <span>•</span>
            <span>Conversational AI Weather Decision Assistant</span>
          </div>
          <p className="text-[11px] text-slate-400">
            “Mausam sirf jaaniye nahi — uske hisaab se faisla lijiye.”
          </p>
        </div>
      </footer>
    </div>
  );
}

