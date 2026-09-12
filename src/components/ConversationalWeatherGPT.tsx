import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Send, Sparkles, X, Bot, User, RefreshCw, Mic, MicOff, Volume2, VolumeX, 
  Radio, Pause, Play, AlertCircle, MessageSquare, MapPin
} from "lucide-react";
import { WeatherData, ChatMessage } from "../types";
import { getLanguage, getSpeechLocale } from "../utils/languages";

interface ConversationalWeatherGPTProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  language: string;
  onSelectCity?: (city: string) => void;
}

// Strip markdown, URLs, code, and emojis to produce natural speech
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italics
    .replace(/#{1,6}\s+/g, "") // headers
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // code snippets
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links
    .replace(/[-*•]\s+/g, ", ") // bullet points to natural pause commas
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emojis
    .replace(/\s+/g, " ")
    .trim();
}

export const ConversationalWeatherGPT: React.FC<ConversationalWeatherGPTProps> = ({
  isOpen,
  onClose,
  weather,
  language,
}) => {
  const langConfig = getLanguage(language);

  const getQuickPrompts = (langId: string) => {
    switch (langId) {
      case "hi":
        return [
          "क्या आज छाता ले जाना चाहिए?",
          "मैं बाइक से जा रहा हूँ, क्या सावधानियां हैं?",
          "आज का AQI कैसा है और मास्क लगाना चाहिए?",
          "घर से निकलने का सबसे सही समय क्या है?",
        ];
      case "bn":
        return [
          "আজ কি ছাতা নিয়ে যাওয়া উচিত?",
          "বাইকে যাতায়াত করা কি নিরাপদ?",
          "আজকের AQI কেমন এবং মাস্ক দরকার কি?",
          "বাইরে বেরোনোর সেরা সময় কোনটি?",
        ];
      case "ta":
        return [
          "இன்று குடை எடுத்துச் செல்ல வேண்டுமா?",
          "பைக் பயணம் பாதுகாப்பானதா?",
          "இன்றைய காற்றின் தரம் (AQI) எப்படி உள்ளது?",
          "வெளியே செல்ல சிறந்த நேரம் எது?",
        ];
      case "te":
        return [
          "ఈ రోజు గొడుగు తీసుకెళ్లాలా?",
          "బైక్ ప్రయాణం సురక్షితమేనా?",
          "ఈ రోజు గాలి నాண్యత (AQI) ఎలా ఉంది?",
          "బయటకు వెళ్లడానికి ఉత్తమ సమయం ఏది?",
        ];
      case "mr":
        return [
          "आज छत्री नेण्याची गरज आहे का?",
          "बाईक चालवणे सुरक्षित आहे का?",
          "आज हवेची गुणवत्ता (AQI) कशी आहे?",
          "बाहेर पडण्यासाठी सर्वात योग्य वेळ कोणती?",
        ];
      default:
        return [
          "Should I carry an umbrella right now?",
          "I'm commuting via two-wheeler, any precautions?",
          "What is the AQI health impact today?",
          "What is the best departure window today?",
        ];
    }
  };

  const quickPrompts = getQuickPrompts(langConfig.id);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: `${langConfig.greeting} I am **VyoomDut AI**, your Conversational Weather & Travel Decision Assistant.

🎙️ **Verbal Voice Conversation is now enabled!**
- Tap **"Live Verbal Mode"** to talk back-and-forth hands-free.
- Or tap the **Microphone (🎤)** on any prompt to speak in ${langConfig.name} (${langConfig.nativeName}) — I will listen and speak my answers back aloud!

Reference Location: **${weather.location.name}** (${weather.current.temp}°C, ${weather.current.condition}). You can also ask about any city or travel route worldwide.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Live Verbal Conversation states
  const [isVerbalMode, setIsVerbalMode] = useState(false);
  const [verbalStatus, setVerbalStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [liveTranscript, setLiveTranscript] = useState("");

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isVerbalModeRef = useRef(isVerbalMode);
  isVerbalModeRef.current = isVerbalMode;

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, liveTranscript]);

  // Clean up all audio and speech recognition when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      stopListening();
      setIsVerbalMode(false);
      setVerbalStatus("idle");
      setLiveTranscript("");
    }
  }, [isOpen]);

  // Speech Synthesis: Speak text out loud
  const speakText = useCallback((text: string, msgId?: string, onFinished?: () => void) => {
    if (!("speechSynthesis" in window)) {
      if (onFinished) onFinished();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const clean = cleanTextForSpeech(text);
      if (!clean) {
        if (onFinished) onFinished();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(clean);
      const targetLocale = getSpeechLocale(language);
      utterance.lang = targetLocale;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Match voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matched = voices.find(
          (v) =>
            v.lang === targetLocale ||
            v.lang.toLowerCase().replace("_", "-").startsWith(targetLocale.toLowerCase().slice(0, 2))
        );
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onstart = () => {
        if (msgId) setSpeakingMsgId(msgId);
        setVerbalStatus("speaking");
      };

      utterance.onend = () => {
        setSpeakingMsgId(null);
        currentUtteranceRef.current = null;
        if (onFinished) onFinished();
      };

      utterance.onerror = (e) => {
        console.warn("Speech synthesis error", e);
        setSpeakingMsgId(null);
        currentUtteranceRef.current = null;
        if (onFinished) onFinished();
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis exception", err);
      setSpeakingMsgId(null);
      if (onFinished) onFinished();
    }
  }, [language]);

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    currentUtteranceRef.current = null;
    if (verbalStatus === "speaking") {
      setVerbalStatus("idle");
    }
  };

  // Stop Speech Recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setLiveTranscript("");
    if (verbalStatus === "listening") {
      setVerbalStatus("idle");
    }
  };

  // Start Speech Recognition
  const startListening = useCallback((continuousLoop = false) => {
    setSpeechError(null);
    stopSpeaking();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. You can type your question.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getSpeechLocale(language);

      recognition.onstart = () => {
        setVerbalStatus("listening");
        setLiveTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentSpoken = final || interim;
        setLiveTranscript(currentSpoken);

        if (final && final.trim()) {
          // Final sentence captured - submit automatically!
          stopListening();
          executeSendMessage(final.trim(), true);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission blocked. Please allow microphone access in your browser settings.");
          setIsVerbalMode(false);
          setVerbalStatus("idle");
        } else if (event.error === "no-speech") {
          // If in continuous verbal mode, re-arm listening after quiet
          if (isVerbalModeRef.current) {
            setTimeout(() => {
              if (isVerbalModeRef.current && verbalStatus !== "speaking" && verbalStatus !== "thinking") {
                startListening(true);
              }
            }, 600);
          } else {
            setVerbalStatus("idle");
          }
        } else {
          setVerbalStatus("idle");
        }
      };

      recognition.onend = () => {
        // Handled in result or error
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      setSpeechError("Could not start microphone. Please check permissions.");
      setVerbalStatus("idle");
    }
  }, [language, verbalStatus]);

  // Execute sending a message and optionally speaking the response
  const executeSendMessage = async (textToSend: string, autoSpeak = false) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLiveTranscript("");
    setIsSending(true);
    setVerbalStatus("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          weatherContext: weather,
          language,
          history: messages.slice(-4),
        }),
      });

      const data = await response.json();
      const replyText = data.reply || "I evaluated your question based on current atmospheric conditions.";
      const botMsgId = `bot-${Date.now()}`;

      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // If user is in Verbal Mode or asked via Voice Mic, speak the answer out loud!
      if (autoSpeak || isVerbalModeRef.current) {
        speakText(replyText, botMsgId, () => {
          // When speaking completes, if still in Verbal Mode, re-listen for next user input!
          if (isVerbalModeRef.current) {
            setTimeout(() => {
              if (isVerbalModeRef.current) {
                startListening(true);
              }
            }, 600);
          } else {
            setVerbalStatus("idle");
          }
        });
      } else {
        setVerbalStatus("idle");
      }
    } catch (err) {
      console.error("Chat API failure", err);
      const fallbackText = `In ${weather.location.name} (${weather.current.temp}°C, ${weather.current.condition}), atmospheric conditions are clear for travel. Feel free to ask what to carry or wear!`;
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: `🌤️ **VyoomDut AI:** ${fallbackText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);

      if (autoSpeak || isVerbalModeRef.current) {
        speakText(fallbackText, errorMsg.id, () => {
          if (isVerbalModeRef.current) {
            setTimeout(() => {
              if (isVerbalModeRef.current) startListening(true);
            }, 600);
          } else {
            setVerbalStatus("idle");
          }
        });
      } else {
        setVerbalStatus("idle");
      }
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Live Verbal Mode (hands-free conversational loop)
  const toggleVerbalMode = () => {
    if (isVerbalMode) {
      setIsVerbalMode(false);
      stopSpeaking();
      stopListening();
    } else {
      setIsVerbalMode(true);
      startListening(true);
    }
  };

  // Single-turn voice mic toggle
  const handleMicClick = () => {
    if (verbalStatus === "listening") {
      stopListening();
    } else if (verbalStatus === "speaking") {
      stopSpeaking();
    } else {
      startListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-2xl">
      {/* 1. Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white">VyoomDut AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                {language}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Verbal AI Assistant • {weather.location.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Verbal Mode Toggle */}
          <button
            onClick={toggleVerbalMode}
            title={isVerbalMode ? "Exit Live Verbal Mode" : "Start Live Verbal Conversation"}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isVerbalMode
                ? "bg-emerald-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isVerbalMode ? "text-slate-950 animate-spin" : "text-emerald-400"}`} />
            <span>{isVerbalMode ? "Voice Live" : "Live Voice Mode"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Live Verbal HUD Banner (Visible when Live Verbal Mode is ON or Mic is Active) */}
      {(isVerbalMode || verbalStatus !== "idle") && (
        <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border-b border-cyan-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Dynamic Soundwave Animation */}
              <div className="flex items-end gap-1 h-5 shrink-0 px-1">
                <span className={`w-1 rounded-full bg-cyan-400 transition-all ${
                  verbalStatus === "listening" ? "h-5 animate-pulse" : verbalStatus === "speaking" ? "h-4 animate-bounce" : "h-1.5 opacity-40"
                }`} />
                <span className={`w-1 rounded-full bg-emerald-400 transition-all ${
                  verbalStatus === "listening" ? "h-3 animate-pulse delay-75" : verbalStatus === "speaking" ? "h-5 animate-bounce delay-100" : "h-2 opacity-40"
                }`} />
                <span className={`w-1 rounded-full bg-cyan-300 transition-all ${
                  verbalStatus === "listening" ? "h-4 animate-pulse delay-150" : verbalStatus === "speaking" ? "h-3 animate-bounce delay-75" : "h-1 opacity-40"
                }`} />
                <span className={`w-1 rounded-full bg-teal-400 transition-all ${
                  verbalStatus === "listening" ? "h-5 animate-pulse delay-100" : verbalStatus === "speaking" ? "h-4 animate-bounce delay-150" : "h-1.5 opacity-40"
                }`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {verbalStatus === "listening" && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Listening to you...
                    </span>
                  )}
                  {verbalStatus === "thinking" && (
                    <span className="text-cyan-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      VyoomDut is thinking...
                    </span>
                  )}
                  {verbalStatus === "speaking" && (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      VyoomDut is speaking...
                    </span>
                  )}
                  {verbalStatus === "idle" && (
                    <span className="text-slate-400">Verbal Mode Ready</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-300 truncate mt-0.5">
                  {liveTranscript ? (
                    <span className="italic text-white">“{liveTranscript}”</span>
                  ) : verbalStatus === "listening" ? (
                    `Speak naturally in ${langConfig.name}...`
                  ) : verbalStatus === "speaking" ? (
                    "Tap Stop to interrupt"
                  ) : (
                    "Tap Speak to continue"
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button in HUD */}
            <div className="flex items-center gap-1.5 shrink-0">
              {verbalStatus === "speaking" && (
                <button
                  onClick={stopSpeaking}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1"
                >
                  <Pause className="w-3 h-3 text-rose-400" />
                  <span>Stop</span>
                </button>
              )}

              {verbalStatus === "idle" && isVerbalMode && (
                <button
                  onClick={() => startListening(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1"
                >
                  <Mic className="w-3 h-3" />
                  <span>Speak</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Speech Error Warning */}
      {speechError && (
        <div className="px-4 py-2 bg-rose-950/50 border-b border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="text-rose-400 hover:text-white text-xs ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 3. Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => {
          const isSpeakingThis = speakingMsgId === msg.id;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  msg.sender === "user"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-cyan-400 border border-slate-700"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap relative group ${
                  msg.sender === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none shadow-md"
                    : isSpeakingThis
                    ? "bg-slate-950 text-slate-100 border border-cyan-500/80 rounded-tl-none shadow-md shadow-cyan-500/10"
                    : "bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.text}

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "bot" && (
                    <button
                      onClick={() => {
                        if (isSpeakingThis) {
                          stopSpeaking();
                        } else {
                          speakText(msg.text, msg.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
                      title={isSpeakingThis ? "Stop speaking" : "Read aloud"}
                    >
                      {isSpeakingThis ? (
                        <>
                          <VolumeX className="w-3 h-3 text-cyan-400 animate-pulse" />
                          <span className="text-[10px] text-cyan-400 font-bold">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span className="text-[10px]">Speak Aloud</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-10">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>VyoomDut AI is analyzing atmospheric vectors...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 4. Suggested Quick Decision Queries */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Suggested Decision Queries:
        </span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => executeSendMessage(prompt, isVerbalMode)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 shrink-0 transition hover:border-cyan-500/40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Input Form with Voice Button */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSendMessage(inputPrompt, isVerbalMode);
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                verbalStatus === "listening"
                  ? "Listening... speak now in your language"
                  : isVerbalMode
                  ? "Verbal mode on (or type here)..."
                  : `Ask VyoomDut or speak in ${language}...`
              }
              className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-900 text-sm text-slate-100 rounded-xl border transition placeholder:text-slate-500 focus:outline-none ${
                verbalStatus === "listening"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 animate-pulse"
                  : "border-slate-700/80 focus:border-cyan-500"
              }`}
            />
            {/* Mic button in input */}
            <button
              type="button"
              onClick={handleMicClick}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
                verbalStatus === "listening"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 animate-pulse"
                  : verbalStatus === "speaking"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              }`}
              title={
                verbalStatus === "listening"
                  ? "Stop listening"
                  : verbalStatus === "speaking"
                  ? "Stop speaking"
                  : "Speak now (Auto-speaks reply)"
              }
            >
              {verbalStatus === "listening" ? (
                <Mic className="w-4 h-4" />
              ) : verbalStatus === "speaking" ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isSending}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition font-bold shadow-md shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
