import React, { useState, useRef } from "react";
import { 
  X, Upload, Camera, Sparkles, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Luggage, ArrowRight 
} from "lucide-react";
import { WeatherData, BagAnalysisResult } from "../types";

interface ShowMeYourBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
}

export const ShowMeYourBagModal: React.FC<ShowMeYourBagModalProps> = ({
  isOpen,
  onClose,
  weather,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<BagAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeBag = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const resp = await fetch("/api/analyze-bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          weatherContext: weather,
          destination: weather.location.name,
          tripDays: 2,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Bag analysis failed");
      }
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to analyze bag. Please verify GEMINI_API_KEY.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sample pre-loaded bag demo if user wants to test without uploading immediately
  const handleLoadDemoBag = () => {
    // A sample lightweight mock image representation (data URI 1x1 or mock canvas)
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Travel Bag: Jacket, Umbrella, Shoes", 30, 150);
    }
    const sampleUri = canvas.toDataURL("image/jpeg");
    setSelectedImage(sampleUri);
    setMimeType("image/jpeg");
    setResult({
      detectedItems: [
        { name: "Compact Umbrella", category: "Rain Protection", confidence: "HIGH" },
        { name: "Cotton T-Shirts (x2)", category: "Clothing", confidence: "HIGH" },
        { name: "Running Sneakers", category: "Footwear", confidence: "HIGH" },
        { name: "Power Bank 10,000mAh", category: "Electronics", confidence: "HIGH" },
        { name: "Heavy Down Winter Jacket", category: "Warm Layer", confidence: "HIGH" },
      ],
      preparednessScore: 74,
      weatherPreparedVerdict: "Partially Prepared for Destination Rain",
      missingEssentials: [
        { item: "Waterproof Backpack Rain Cover", urgency: "CRITICAL", reason: `Rain probability in ${weather.location.name} is elevated; electronics risk water exposure.` },
        { item: "Ziploc bags for documents", urgency: "RECOMMENDED", reason: "Protects IDs and tickets from sudden downpours." }
      ],
      unnecessaryItems: [
        { item: "Heavy Down Winter Jacket", reason: `Current temperature is ${weather.current.temp}°C. A winter down jacket adds needless luggage weight.` }
      ],
      recommendationSummary: "Drop the heavy winter jacket and add an external waterproof bag slipcover to boost your trip preparedness to 96/100."
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Luggage className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                “Show Me Your Bag” AI
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                Multimodal Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Snap or upload a photo of your packed bag. AI identifies items against current weather in {weather.location.name}.
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        {!selectedImage ? (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-950/50 hover:bg-slate-800/30 flex flex-col items-center justify-center"
            >
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-sm font-bold text-slate-200">
                Click or drag & drop a photo of your bag or packed items
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports JPG, PNG, WEBP (Max 10MB)
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Don't have a photo right now?</span>
              <button
                type="button"
                onClick={handleLoadDemoBag}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
              >
                Load Sample Packed Bag Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Image Preview & Controls */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-56 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Packed bag preview"
                className="w-full h-56 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setResult(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 text-xs font-medium border border-slate-700 backdrop-blur-sm"
                >
                  Change Photo
                </button>
              </div>
            </div>

            {!result && (
              <button
                onClick={handleAnalyzeBag}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span>{isAnalyzing ? "Scanning Bag Contents with Gemini Vision..." : "Run AI Weather Packing Scan"}</span>
              </button>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Analysis notice</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {result && (
              <div className="space-y-4 pt-2">
                {/* Preparedness Score Bar */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                      Trip Preparedness
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {result.weatherPreparedVerdict}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black ${
                      result.preparednessScore >= 75 ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {result.preparednessScore}%
                    </span>
                  </div>
                </div>

                {/* Detected Items Grid */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Detected Items in Photo
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.detectedItems.map((item, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing & Unnecessary items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Missing */}
                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Missing Essentials</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {result.missingEssentials.map((m, i) => (
                        <li key={i} className="text-slate-300">
                          <strong className="text-white block">{m.item}</strong>
                          <span className="text-[11px] text-slate-400">{m.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Unnecessary */}
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                      <XCircle className="w-4 h-4" />
                      <span>Unnecessary Baggage</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {result.unnecessaryItems.map((u, i) => (
                        <li key={i} className="text-slate-300">
                          <strong className="text-white block">{u.item}</strong>
                          <span className="text-[11px] text-slate-400">{u.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendation summary */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200">
                  <strong>AI Conclusion:</strong> {result.recommendationSummary}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
