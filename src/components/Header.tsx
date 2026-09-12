import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Globe, ChevronDown, Mic, MicOff, Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { ALL_LANGUAGES, getLanguage, getUITranslation, getSpeechLocale } from "../utils/languages";

interface CitySuggestion {
  name: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface HeaderProps {
  currentCity: string;
  currentCondition?: string;
  onSearch: (city: string) => void;
  onLocateMe: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onOpenLanguageModal: () => void;
  onOpenBagModal?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  isLocating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  currentCondition = "clear",
  onSearch,
  onLocateMe,
  selectedLanguage,
  onLanguageChange,
  onOpenLanguageModal,
  isLocating,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);
  const currentLangConfig = getLanguage(selectedLanguage);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions as user types
  useEffect(() => {
    const query = searchInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setIsSearchingCities(true);
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn("Error fetching city suggestions:", err);
      } finally {
        setIsSearchingCities(false);
      }
    }, 200);

    return () => clearTimeout(debounceTimerRef.current);
  }, [searchInput]);

  // Voice recognition for search
  const toggleVoiceSearch = () => {
    if (isListeningVoice) {
      recognitionRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please type the city name.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getSpeechLocale(selectedLanguage);

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanCity = transcript.replace(/(weather in|weather of|mausam|ka mausam|temperature in)/gi, "").trim();
          const target = cleanCity || transcript;
          setSearchInput(target);
          onSearch(target);
          setShowDropdown(false);
          setIsListeningVoice(false);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Voice search error:", err);
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListeningVoice(false);
    }
  };

  const handleSelectCity = (cityName: string) => {
    setSearchInput("");
    setShowDropdown(false);
    onSearch(cityName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setSearchInput("");
      setShowDropdown(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <Logo size="md" showTagline={true} />

          {/* Mobile Action Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            {/* Voice Mic on Mobile */}
            <button
              onClick={toggleVoiceSearch}
              className={`p-2 rounded-xl border text-xs transition flex items-center justify-center ${
                isListeningVoice
                  ? "bg-rose-500 text-white border-rose-400 animate-pulse ring-2 ring-rose-500/30"
                  : "bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800"
              }`}
              title="Voice Search (Speak City Name)"
            >
              {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Mobile Language Button */}
            <button
              onClick={onOpenLanguageModal}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-[11px] max-w-[50px] truncate">{currentLangConfig.nativeName}</span>
            </button>
          </div>
        </div>

        {/* Global Search Bar with Auto-Complete Options Dropdown, Voice Mic & GPS */}
        <div ref={searchContainerRef} className="relative w-full md:max-w-md">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                isListeningVoice
                  ? "Listening... speak city or area name..."
                  : `Search any city (e.g., ${currentCity}, Shimla, Paris)...`
              }
              className={`w-full pl-10 pr-24 py-2 text-sm text-slate-100 rounded-xl border transition-all placeholder:text-slate-500 focus:outline-none ${
                isListeningVoice
                  ? "bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/30"
                  : "bg-slate-900/90 border-slate-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
              }`}
            />

            {/* Loading Indicator */}
            {isSearchingCities && (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-16 pointer-events-none" />
            )}
            
            {/* Voice Mic Button in Search Input */}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              title={isListeningVoice ? "Stop voice listening" : "Speak city name (Voice Search)"}
              className={`absolute right-10 p-1.5 rounded-lg transition ${
                isListeningVoice
                  ? "bg-rose-500 text-white animate-pulse"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              }`}
            >
              {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* GPS Locate Button */}
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              title="Use current GPS location"
              className="absolute right-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1 transition"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline text-[11px]">GPS</span>
            </button>
          </form>

          {/* Search Options Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <span>Matching Cities & Locations</span>
                <span className="text-[10px] text-cyan-400">Select to load</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${item.admin1}-${idx}`}
                    type="button"
                    onClick={() => handleSelectCity(item.name)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {item.name}
                        </div>
                        {(item.admin1 || item.country) && (
                          <div className="text-[11px] text-slate-400">
                            {[item.admin1, item.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-300 font-medium">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Tools (Language + AI Actions) - Ambiance Removed */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language Selector Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
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
              className="bg-transparent focus:outline-none cursor-pointer text-slate-200 text-xs font-semibold pr-1 max-w-[105px] truncate"
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
                ✨ 22 Languages...
              </option>
            </select>
            <button
              onClick={onOpenLanguageModal}
              title="Open full multilingual directory"
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
