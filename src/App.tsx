import React, { useState, useEffect } from "react";
import { 
  Sparkles, RefreshCw, AlertTriangle, ShieldCheck, MapPin, 
  MessageSquare, Luggage, Navigation, CheckCircle2,
  Headphones, AlertOctagon, Globe
} from "lucide-react";
import { WeatherData } from "./types";
import { Header } from "./components/Header";
import { HeroWeatherCard } from "./components/HeroWeatherCard";
import { WeatherMissionMode } from "./components/WeatherMissionMode";
import { WeatherAwareRoute } from "./components/WeatherAwareRoute";
import { ShowMeYourBagModal } from "./components/ShowMeYourBagModal";
import { DisasterRiskRadar } from "./components/DisasterRiskRadar";
import { HomeActionsAndDeparture } from "./components/HomeActionsAndDeparture";
import { ConversationalWeatherGPT } from "./components/ConversationalWeatherGPT";
import { DailyAudioBulletin } from "./components/DailyAudioBulletin";
import { LanguageSelectorModal } from "./components/LanguageSelectorModal";
import { getUITranslation } from "./utils/languages";

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

  // Active view section tab - streamlined to core actionable modes
  const [activeSection, setActiveSection] = useState<
    "mission" | "departure" | "audio" | "route" | "disaster"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {isLoading && !weatherData ? (
          <div className="py-28 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Loading Weather Intelligence...
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fetching atmospheric models, action recommendations, and hourly forecast for {currentCity}.
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

            {/* Streamlined Clean Navigation Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSection("mission")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "mission"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{getUITranslation("missionMode", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("departure")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "departure"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>{getUITranslation("departure", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("audio")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "audio"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>{getUITranslation("audioBulletin", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("route")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "route"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <span>{getUITranslation("routeCorridor", language)}</span>
                </button>

                <button
                  onClick={() => setActiveSection("disaster")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeSection === "disaster"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{getUITranslation("disasterRadar", language)}</span>
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

              {activeSection === "departure" && (
                <HomeActionsAndDeparture weather={weatherData} />
              )}

              {activeSection === "audio" && (
                <DailyAudioBulletin
                  weatherData={weatherData}
                  language={language}
                />
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
            </div>
          </>
        ) : fetchError ? (
          <div className="py-16 max-w-lg mx-auto text-center bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Weather Data Connection Issue</h3>
              <p className="text-xs text-slate-400 mt-2">
                {fetchError}
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
          title="Open VyoomDut AI Voice & Verbal Conversation"
        >
          <Sparkles className="w-4 h-4" />
          <span>Talk / Ask VyoomDut AI</span>
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
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-5 text-center text-xs text-slate-500 mt-8">
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

