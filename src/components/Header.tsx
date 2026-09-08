import React, { useState, useEffect } from "react";
import { Search, MapPin, Sparkles, Navigation, Globe, Luggage, MessageSquare, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { weatherAudio } from "../utils/weatherAudio";
import { ALL_LANGUAGES, getLanguage, getUITranslation } from "../utils/languages";

interface HeaderProps {
  currentCity: string;
  currentCondition?: string;
  onSearch: (city: string) => void;
  onLocateMe: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onOpenLanguageModal: () => void;
  onOpenBagModal: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  isLocating: boolean;
}

const POPULAR_QUICK_CITIES = ["Delhi", "Mumbai", "Shimla", "Manali", "Gangtok", "Bengaluru", "London", "Tokyo"];

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  currentCondition = "clear",
  onSearch,
  onLocateMe,
  selectedLanguage,
  onLanguageChange,
  onOpenLanguageModal,
  onOpenBagModal,
  onToggleChat,
  isChatOpen,
  isLocating,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const currentLangConfig = getLanguage(selectedLanguage);

  const toggleSoundscape = () => {
    if (isPlayingAudio) {
      weatherAudio.stop();
      setIsPlayingAudio(false);
    } else {
      weatherAudio.play(currentCondition, 0.25);
      setIsPlayingAudio(true);
    }
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      weatherAudio.stop();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setSearchInput("");
    }
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <Logo size="md" showTagline={true} />

          {/* Mobile Action Buttons */}
          <div className="flex items-center gap-1.5 md:hidden">
            {/* Mobile Language Button */}
            <button
              onClick={onOpenLanguageModal}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-[11px] max-w-[50px] truncate">{currentLangConfig.nativeName}</span>
            </button>

            <button
              onClick={toggleSoundscape}
              className={`p-2 rounded-lg border text-sm transition ${
                isPlayingAudio
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
              title="Atmosphere Ambient Soundscape"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onOpenBagModal}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400"
              title="Show Me Your Bag AI"
            >
              <Luggage className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleChat}
              className={`p-2 rounded-lg border text-sm flex items-center gap-1.5 ${
                isChatOpen
                  ? "bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/25"
                  : "bg-slate-900 text-slate-200 border-slate-700"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="w-full md:max-w-md">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search any city (e.g., ${currentCity}, Shimla, Paris)...`}
              className="w-full pl-10 pr-24 py-2 bg-slate-900/90 text-sm text-slate-100 rounded-xl border border-slate-700/80 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              title="Use current GPS location"
              className="absolute right-2 px-2 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1 transition"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline">GPS</span>
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 text-[11px] text-slate-400">
            <span className="text-slate-500 shrink-0">Popular:</span>
            {POPULAR_QUICK_CITIES.slice(0, 6).map((city) => (
              <button
                key={city}
                onClick={() => onSearch(city)}
                className={`px-2 py-0.5 rounded-md border shrink-0 transition-colors ${
                  city.toLowerCase() === currentCity.toLowerCase()
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                    : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-800"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools (Language + Soundscape + Modals) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Ambient Soundscape Synthesizer */}
          <button
            onClick={toggleSoundscape}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
              isPlayingAudio
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800"
            }`}
            title="Listen to live synthesized weather ambiance"
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300">Ambiance On</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Soundscape</span>
              </>
            )}
          </button>

          {/* Language Selector Pill with Modal Trigger */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                if (e.target.value === "__OPEN_MODAL__") {
                  onOpenLanguageModal();
                } else {
                  onLanguageChange(e.target.value);
                }
              }}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-200 text-xs font-semibold pr-1 max-w-[120px] truncate"
            >
              <option value="English" className="bg-slate-900 text-white">English</option>
              <option value="Hindi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="Hinglish" className="bg-slate-900 text-white">हिंग्लिश (Hinglish)</option>
              <option value="Bengali" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
              <option value="Marathi" className="bg-slate-900 text-white">मराठी (Marathi)</option>
              <option value="Telugu" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
              <option value="Tamil" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
              <option value="Gujarati" className="bg-slate-900 text-white">ગુજરાતી (Gujarati)</option>
              <option value="Kannada" className="bg-slate-900 text-white">ಕನ್ನಡ (Kannada)</option>
              <option value="Malayalam" className="bg-slate-900 text-white">മലയാളം (Malayalam)</option>
              <option value="Punjabi" className="bg-slate-900 text-white">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="Odia" className="bg-slate-900 text-white">ଓଡ଼ିଆ (Odia)</option>
              <option value="Assamese" className="bg-slate-900 text-white">অসমীয়া (Assamese)</option>
              <option value="Urdu" className="bg-slate-900 text-white">اردو (Urdu)</option>
              <option value="__OPEN_MODAL__" className="bg-cyan-950 text-cyan-300 font-bold">
                ✨ All 22 Indian Languages...
              </option>
            </select>
            <button
              onClick={onOpenLanguageModal}
              title="Open full multilingual directory"
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Show Me Your Bag AI Trigger */}
          <button
            onClick={onOpenBagModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Luggage className="w-3.5 h-3.5" />
            <span>Bag Vision AI</span>
          </button>

          {/* Toggle Conversational VyoomDut AI */}
          <button
            onClick={onToggleChat}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md ${
              isChatOpen
                ? "bg-cyan-500 text-slate-950 font-bold shadow-cyan-500/30"
                : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask VyoomDut AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
