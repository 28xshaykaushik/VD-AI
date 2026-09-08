import React, { useState, useMemo } from "react";
import { X, Search, Globe, Check, Sparkles, Volume2 } from "lucide-react";
import { ALL_LANGUAGES, LanguageConfig, getSpeechLocale } from "../utils/languages";

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onSelectLanguage: (languageName: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("All");

  const regions = ["All", "Pan-India", "North", "South", "East", "West", "North-East", "Classical", "Global"];

  const filteredLanguages = useMemo(() => {
    return ALL_LANGUAGES.filter((lang) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.region.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = activeRegion === "All" || lang.region === activeRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchTerm, activeRegion]);

  const testVoice = (e: React.MouseEvent, lang: LanguageConfig) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(lang.greeting + " " + lang.slogan);
    utterance.lang = getSpeechLocale(lang.name);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">Select Your Language</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {ALL_LANGUAGES.length} Languages
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full support for all 22 official Indian languages with native scripts & voice AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Region Filter */}
        <div className="p-4 sm:p-6 pb-3 border-b border-slate-800/80 space-y-3 bg-slate-950/40">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, script (e.g., தமிழ், বাংলা, हिन्दी, Marathi, Urdu)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 text-sm text-slate-100 rounded-xl border border-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeRegion === region
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh] space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage.toLowerCase() === lang.name.toLowerCase();

              return (
                <div
                  key={lang.id}
                  onClick={() => {
                    onSelectLanguage(lang.name);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? "bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400"
                      : "bg-slate-850 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-base font-bold text-white tracking-wide">
                        {lang.nativeName}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => testVoice(e, lang)}
                          title="Listen to native voice"
                          className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                        {isSelected && (
                          <span className="p-1 rounded-md bg-cyan-500 text-slate-950">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-300">{lang.name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {lang.region}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed">
                      "{lang.slogan}"
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                    <span>{lang.greeting}</span>
                    <span className="text-slate-500">{lang.speechCode}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No languages found matching "{searchTerm}"</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setActiveRegion("All");
                }}
                className="mt-2 text-xs text-cyan-400 underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Voice commands, text chat, and mission analysis dynamically adapt to your selected language.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
