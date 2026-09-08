import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, X, Bot, User, RefreshCw, Mic, MicOff, Volume2, VolumeX, Check, Globe 
} from "lucide-react";
import { WeatherData, ChatMessage } from "../types";
import { getLanguage, getSpeechLocale } from "../utils/languages";

interface ConversationalWeatherGPTProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  language: string;
}

export const ConversationalWeatherGPT: React.FC<ConversationalWeatherGPTProps> = ({
  isOpen,
  onClose,
  weather,
  language,
}) => {
  const langConfig = getLanguage(language);

  const getQuickPrompts = (langName: string) => {
    switch (langConfig.id) {
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
          "ఈ రోజు గాలి నాణ్యత (AQI) ఎలా ఉంది?",
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

  const quickPrompts = getQuickPrompts(language);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: `${langConfig.greeting} I am **VyoomDut AI**, your Intelligent Weather Decision Assistant.

I don't just state raw numbers like "Rain 70%". I tell you **what to carry, what to avoid, the best time to step out, and how to stay safe**.

Current location: **${weather.location.name}** (${weather.current.temp}°C, ${weather.current.condition}).
Selected Language: **${langConfig.name} (${langConfig.nativeName})**.
How can I assist your plans today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Voice Input Setup
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getSpeechLocale(language);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputPrompt(transcript);
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text-to-Speech Readout
  const speakMessage = (id: string, text: string) => {
    if (!("speechSynthesis" in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner audio speech
    const cleanText = text.replace(/[*_#`[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getSpeechLocale(language);
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsSending(true);

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
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "I analyzed your request based on current atmospheric conditions.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: `🌤️ **VyoomDut AI:** In ${weather.location.name} (${weather.current.temp}°C, ${weather.current.condition}), roads and atmospheric conditions are currently manageable. Let me know what activity or journey you are planning!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white">VyoomDut AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                {language}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Ground Decisions for {weather.location.name}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => (
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
                  : "bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.text}

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px] text-slate-500">
                <span>{msg.timestamp}</span>
                {msg.sender === "bot" && (
                  <button
                    onClick={() => speakMessage(msg.id, msg.text)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
                    title="Read out loud"
                  >
                    {speakingMsgId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] text-cyan-400">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span className="text-[10px]">Listen</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-10">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>VyoomDut AI is analyzing atmospheric vectors...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Suggested Decision Queries:
        </span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 shrink-0 transition hover:border-cyan-500/40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form with Voice Support */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : `Ask VyoomDut in ${language}...`}
              className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-900 text-sm text-slate-100 rounded-xl border transition placeholder:text-slate-500 focus:outline-none ${
                isListening
                  ? "border-rose-500 ring-2 ring-rose-500/20 animate-pulse"
                  : "border-slate-700/80 focus:border-cyan-500"
              }`}
            />
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
                isListening
                  ? "bg-rose-500 text-white animate-bounce"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              }`}
              title={isListening ? "Stop listening" : "Speak voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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

