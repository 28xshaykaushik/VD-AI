import React, { useState, useEffect, useRef } from "react";
import { 
  Headphones, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Radio, 
  Sliders,
  Sun,
  CloudRain,
  Wind,
  ShieldCheck
} from "lucide-react";
import { WeatherData } from "../types";
import { getLanguage, getSpeechLocale } from "../utils/languages";

interface DailyAudioBulletinProps {
  weatherData: WeatherData;
  language: string;
}

export const DailyAudioBulletin: React.FC<DailyAudioBulletinProps> = ({ weatherData, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isCopied, setIsCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<any>(null);

  const langConfig = getLanguage(language);
  const loc = weatherData.location.name;
  const temp = weatherData.current.temp;
  const cond = weatherData.current.condition;
  const rain = weatherData.current.precipitation;
  const wind = weatherData.current.windSpeed;
  const aqi = weatherData.current.aqi;
  const highTemp = weatherData.daily[0]?.maxTemp ?? temp + 3;
  const lowTemp = weatherData.daily[0]?.minTemp ?? temp - 4;
  const rainPop = weatherData.hourly[0]?.pop ?? 20;

  // Generate culturally fluent broadcast bulletin text in selected language
  const getLocalizedBulletin = (): { title: string; script: string; takeaways: string[] } => {
    switch (langConfig.id) {
      case "hi":
        return {
          title: `मौसम वाणी बुलेटिन — ${loc} दैनिक समाचार`,
          script: `नमस्कार! यह मौसम वाणी का दैनिक मौसम बुलेटिन है ${loc} के लिए। आज ${loc} में तापमान ${lowTemp} से ${highTemp} डिग्री सेल्सियस के बीच रहेगा। वर्तमान तापमान ${temp} डिग्री सेल्सियस है और आसमान में ${cond} की स्थिति है। बारिश की संभावना लगभग ${rainPop} प्रतिशत है। यदि आप आज बाहर निकल रहे हैं, तो ${rain > 0 ? "छाता और वाटरप्रूफ बैग अवश्य साथ रखें।" : "पानी की बोतल साथ रखें और धूप से बचें।"} वायु गुणवत्ता सूचकांक यानी एक्यूआई ${aqi} दर्ज किया गया है। मौसम सिर्फ जानिए नहीं, उसके हिसाब से फैसला लीजिए। आपका दिन शुभ और सुरक्षित रहे!`,
          takeaways: [
            `अधिकतम तापमान: ${highTemp}°C, न्यूनतम: ${lowTemp}°C`,
            `बारिश का जोखिम: ${rainPop}% (${rain > 0 ? "वर्षा सक्रिय" : "शुष्क मौसम"})`,
            `सड़क सुरक्षा: ${rain > 0 ? "सतर्क रहें, फिसलन संभव" : "सामान्य आवागमन सुरक्षित"}`,
            `वायु गुणवत्ता: AQI ${aqi} (${aqi > 150 ? "मास्क आवश्यक" : "संतोषजनक"})`,
          ],
        };

      case "bn":
        return {
          title: `মৌসম বাণী বুলেটিন — ${loc} দৈনিক আবহাওয়া খবর`,
          script: `নমস্কার! এটি মৌসম বাণীর দৈনিক আবহাওয়া বুলেটিন ${loc}-এর জন্য। আজকে ${loc}-এ তাপমাত্রা ${lowTemp} থেকে ${highTemp} ডিগ্রি সেলসিয়াসের মধ্যে থাকবে। বর্তমান তাপমাত্রা ${temp} ডিগ্রি সেলসিয়াস এবং আকাশ ${cond}। বৃষ্টির সম্ভাবনা প্রায় ${rainPop} শতাংশ। আপনি যদি আজ বাইরে বের হন, তবে ${rain > 0 ? "সঙ্গে ছাতা এবং রেইনকোট রাখুন।" : "পর্যাপ্ত জল পান করুন এবং সুরক্ষায় থাকুন।"} বায়ুর মান সূচক অর্থাৎ AQI ${aqi}। শুধু আবহাওয়া জানবেন না, সঠিক সিদ্ধান্ত নিন। আপনার দিনটি সুন্দর ও নিরাপদ হোক!`,
          takeaways: [
            `সর্বোচ্চ তাপমাত্রা: ${highTemp}°C, সর্বনিম্ন: ${lowTemp}°C`,
            `বৃষ্টির ঝুঁকি: ${rainPop}%`,
            `যাতায়াত সতর্কতা: ${rain > 0 ? "পিচ্ছিল রাস্তা থেকে সাবধান" : "স্বাভাবিক"}`,
            `বায়ুর গুণমান: AQI ${aqi}`,
          ],
        };

      case "ta":
        return {
          title: `மௌசம் வாணி புல்லட்டின் — ${loc} வானிலை செய்தி`,
          script: `வணக்கம்! இது ${loc}-க்கான மௌசம் வாணியின் தினசரி வானிலை அறிக்கை. இன்று ${loc}-ல் வெப்பநிலை ${lowTemp} முதல் ${highTemp} டிகிரி செல்சியஸ் வரை நிலவும். தற்போதைய வெப்பநிலை ${temp} டிகிரி செல்சியஸ் ஆகும். மழை பெய்வதற்கான வாய்ப்பு ${rainPop} சதவீதம். நீங்கள் வெளியில் செல்வதாக இருந்தால் ${rain > 0 ? "குடை மற்றும் பாதுகாப்பு கவசங்களை எடுத்துச் செல்லுங்கள்." : "குடிநீர் பாட்டிலை உடன் வைத்துக்கொள்ளுங்கள்."} காற்றின் தரம் AQI ${aqi} ஆக பதிவாகியுள்ளது. வானிலை அறிக்கை மட்டுமல்ல, அதற்கான முடிவுகளையும் எடுங்கள். நல்ல நாளாக அமைய வாழ்த்துகள்!`,
          takeaways: [
            `அதிகபட்ச வெப்பநிலை: ${highTemp}°C, குறைந்தபட்சம்: ${lowTemp}°C`,
            `மழை வாய்ப்பு: ${rainPop}%`,
            `சாலைப் பாதுகாப்பு: ${rain > 0 ? "கவனமாக வாகனத்தை இயக்கவும்" : "சாதாரணமானது"}`,
            `காற்றின் தரம்: AQI ${aqi}`,
          ],
        };

      case "te":
        return {
          title: `మౌసం వాణి బులెటిన్ — ${loc} రోజువారీ వాతావరణ సమాచారం`,
          script: `నమస్కారం! ఇది ${loc} కోసం మౌసం వాణి రోజువారీ వాతావరణ బులెటిన్. ఈ రోజు ${loc}లో ఉష్ణోగ్రత ${lowTemp} నుండి ${highTemp} డిగ్రీల సెల్సియస్ మధ్య ఉంటుంది. ప్రస్తుత ఉష్ణోగ్రత ${temp} డిగ్రీలు మరియు వాతావరణం ${cond}గా ఉంది. వర్షం పడే అవకాశం ${rainPop} శాతం. మీరు బయటకు వెళుతుంటే ${rain > 0 ? "గొడుగు వెంట ఉంచుకోండి." : "మంచినీటి సీసా తీసుకెళ్లండి."} గాలి నాణ్యత సూచిక AQI ${aqi}గా నమోదైంది. వాతావరణాన్ని తెలుసుకోవడమే కాదు, సరైన నిర్ణయం తీసుకోండి. మీ రోజు శుభప్రదం కావాలి!`,
          takeaways: [
            `గరిష్ట ఉష్ణోగ్రత: ${highTemp}°C, కనిష్ట: ${lowTemp}°C`,
            `వర్షం అవకాశం: ${rainPop}%`,
            `రహదారి భద్రత: ${rain > 0 ? "జాగ్రత్తగా ప్రయాణించండి" : "సురక్షితం"}`,
            `గాలి నాణ్యత: AQI ${aqi}`,
          ],
        };

      case "mr":
        return {
          title: `हवामान वाणी बातमीपत्र — ${loc} दैनिक हवामान`,
          script: `नमस्कार! हे ${loc} साठी हवामान वाणीचे दैनिक बातमीपत्र आहे. आज ${loc} मध्ये तापमान ${lowTemp} ते ${highTemp} अंश सेल्सिअस दरम्यान राहील. सद्य तापमान ${temp} अंश सेल्सिअस असून हवामान ${cond} आहे. पावसाची शक्यता सुमारे ${rainPop} टक्के आहे. आपण बाहेर पडत असाल तर ${rain > 0 ? "छत्री आणि रेनकोट सोबत ठेवा." : "पाण्याची बाटली सोबत ठेवा."} हवा गुणवत्ता निर्देशांक AQI ${aqi} आहे. केवळ हवामान समजू नका, त्यानुसार योग्य निर्णय घ्या. आपला दिवस आनंददायी जावो!`,
          takeaways: [
            `कमाल तापमान: ${highTemp}°C, किमान: ${lowTemp}°C`,
            `पावसाची शक्यता: ${rainPop}%`,
            `प्रवास सुरक्षा: ${rain > 0 ? "ओल्या रस्त्यांवर सावधगिरी बाळगा" : "सुरक्षित"}`,
            `हवा गुणवत्ता: AQI ${aqi}`,
          ],
        };

      case "gu":
        return {
          title: `મૌસમ વાણી બુલેટિન — ${loc} દૈનિક હવામાન સમાચાર`,
          script: `નમસ્તે! આ ${loc} માટે મૌસમ વાણીનું દૈનિક હવામાન બુલેટિન છે. આજે ${loc}માં તાપમાન ${lowTemp} થી ${highTemp} ડિગ્રી સેલ્સિયસ વચ્ચે રહેશે. હાલનું તાપમાન ${temp} ડિગ્રી છે અને આકાશ ${cond} છે. વરસાદની શક્યતા ${rainPop} ટકા છે. બહાર નીકળતી વખતે ${rain > 0 ? "છત્રી અને રેઈનકોટ સાથે રાખો." : "પાણીની બોટલ સાથે રાખો."} હવા ગુણવત્તા સૂચકાંક AQI ${aqi} છે. માત્ર હવામાન જાણો નહીં, તેના આધારે સાચો નિર્ણય લો!`,
          takeaways: [
            `મહત્તમ તાપમાન: ${highTemp}°C, લઘુત્તમ: ${lowTemp}°C`,
            `વરસાદ સંભાવના: ${rainPop}%`,
            `મુસાફરી સલાહ: ${rain > 0 ? "સાવચેત વાહન ચલાવો" : "સલામત"}`,
            `હવા ગુણવત્તા: AQI ${aqi}`,
          ],
        };

      case "kn":
        return {
          title: `ಮೌಸಂ ವಾಣಿ ಬ್ಯುಲೆಟಿನ್ — ${loc} ದೈನಂದಿನ ಹವಾಮಾನ ವರದಿ`,
          script: `ನಮಸ್ಕಾರ! ಇದು ${loc} ಗಾಗಿ ಮೌಸಂ ವಾಣಿಯ ದೈನಂದಿನ ಹವಾಮಾನ ವರದಿ. ಇಂದು ${loc} ನಲ್ಲಿ ತಾಪಮಾನ ${lowTemp} ರಿಂದ ${highTemp} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಇರಲಿದೆ. ಪ್ರಸ್ತುತ ತಾಪಮಾನ ${temp} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಆಗಿದ್ದು, ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ${rainPop} ಪ್ರತಿಶತ ಇದೆ. ${rain > 0 ? "ಹೊರಡುವಾಗ ಛತ್ರಿ ಇಟ್ಟುಕೊಳ್ಳಿ." : "ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ."} ಹವೆಯ ಗುಣಮಟ್ಟ AQI ${aqi} ಆಗಿದೆ. ಹವಾಮಾನವನ್ನು ಕೇವಲ ತಿಳಿಯಬೇಡಿ, ಅದಕ್ಕೆ ತಕ್ಕ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳಿ!`,
          takeaways: [
            `ಗರಿಷ್ಠ ತಾಪಮಾನ: ${highTemp}°C, ಕನಿಷ್ಠ: ${lowTemp}°C`,
            `ಮಳೆ ಸಂಭವನೀಯತೆ: ${rainPop}%`,
            `ರಸ್ತೆ ಸುರಕ್ಷತೆ: ${rain > 0 ? "ಜಾಗರೂಕರಾಗಿ ಚಾಲನೆ ಮಾಡಿ" : "ಸುರಕ್ಷಿತ"}`,
            `ಗಾಳಿ ಗುಣಮಟ್ಟ: AQI ${aqi}`,
          ],
        };

      case "pa":
        return {
          title: `ਮੌਸਮ ਵਾਣੀ ਬੁਲੇਟਿਨ — ${loc} ਰੋਜ਼ਾਨਾ ਮੌਸਮ ਖ਼ਬਰਾਂ`,
          script: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਇਹ ${loc} ਲਈ ਮੌਸਮ ਵਾਣੀ ਦਾ ਰੋਜ਼ਾਨਾ ਮੌਸਮ ਬੁਲੇਟਿਨ ਹੈ। ਅੱਜ ${loc} ਵਿੱਚ ਤਾਪਮਾਨ ${lowTemp} ਤੋਂ ${highTemp} ਡਿਗਰੀ ਸੈਲਸੀਅਸ ਵਿਚਕਾਰ ਰਹੇਗਾ। ਮੌਜੂਦਾ ਤਾਪਮਾਨ ${temp} ਡਿਗਰੀ ਸੈਲਸੀਅਸ ਹੈ। ਮੀਂਹ ਪੈਣ ਦਾ ਅਨੁਮਾਨ ${rainPop} ਪ੍ਰਤੀਸ਼ਤ ਹੈ। ${rain > 0 ? "ਜੇਕਰ ਬਾਹਰ ਨਿਕਲ ਰਹੇ ਹੋ ਤਾਂ ਛਤਰੀ ਜ਼ਰੂਰ ਨਾਲ ਰੱਖੋ।" : "ਪਾਣੀ ਦੀ ਬੋਤਲ ਨਾਲ ਰੱਖੋ।"} ਹਵਾ ਗੁਣਵੱਤਾ ਸੂਚਕਾਂਕ AQI ${aqi} ਹੈ। ਸਿਰਫ਼ ਮੌਸਮ ਜਾਣੋ ਨਾ, ਉਸ ਦੇ ਮੁਤਾਬਕ ਫ਼ੈਸਲਾ ਲਵੋ!`,
          takeaways: [
            `ਵੱਧ ਤੋਂ ਵੱਧ ਤਾਪਮਾਨ: ${highTemp}°C, ਘੱਟੋ-ਘੱਟ: ${lowTemp}°C`,
            `ਮੀਂਹ ਦਾ ਖ਼ਤਰਾ: ${rainPop}%`,
            `ਯਾਤਰਾ ਸਲਾਹ: ${rain > 0 ? "ਸਾਵਧਾਨੀ ਨਾਲ ਵਾਹਨ ਚਲਾਓ" : "ਸੁਰੱਖਿਅਤ"}`,
            `ਹਵਾ ਗੁਣਵੱਤਾ: AQI ${aqi}`,
          ],
        };

      default:
        // English & Fallback
        return {
          title: `VyoomDut Audio Bulletin — ${loc} Daily Forecast`,
          script: `Good day! This is your VyoomDut Daily Weather Decision Broadcast for ${loc}. Today, temperatures will fluctuate between a low of ${lowTemp}°C and a high of ${highTemp}°C. Currently, it is ${temp}°C under ${cond}. Rain probability stands at ${rainPop}%. ${rain > 0 ? "Make sure to carry an umbrella and protect your electronics." : "Atmospheric conditions are stable for daytime commutes."} The Air Quality Index is recorded at ${aqi}. Remember: Don't just know the weather. Know what to do. Have a safe and productive day!`,
          takeaways: [
            `High / Low: ${highTemp}°C / ${lowTemp}°C`,
            `Rain Risk: ${rainPop}% (${rain > 0 ? "Active Precipitation" : "Dry Window"})`,
            `Commute Traction: ${rain > 0 ? "Caution advised on wet asphalt" : "Clear Road Conditions"}`,
            `Air Quality Index: ${aqi} (${aqi > 150 ? "N95 Mask Recommended" : "Moderate Exposure"})`,
          ],
        };
    }
  };

  const bulletin = getLocalizedBulletin();

  // Play synthetic radio broadcast chime via Web Audio
  const playIntroChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio context might be restricted
    }
  };

  // Toggle Broadcast Voice Playback
  const togglePlay = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      clearInterval(progressIntervalRef.current);
      setProgress(0);
      return;
    }

    window.speechSynthesis.cancel();
    playIntroChime();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(bulletin.script);
      utterance.lang = getSpeechLocale(language);
      utterance.rate = playbackRate;

      utterance.onstart = () => {
        setIsPlaying(true);
        setProgress(0);
        // Track estimated duration
        const estimatedDurationSec = (bulletin.script.length / 15) / playbackRate;
        const stepMs = 200;
        const totalSteps = (estimatedDurationSec * 1000) / stepMs;
        let currentStep = 0;

        progressIntervalRef.current = setInterval(() => {
          currentStep++;
          const pct = Math.min(99, Math.round((currentStep / totalSteps) * 100));
          setProgress(pct);
        }, stepMs);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        clearInterval(progressIntervalRef.current);
        setProgress(100);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        clearInterval(progressIntervalRef.current);
        setProgress(0);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 400);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(`${bulletin.title}\n\n${bulletin.script}\n\nKey Takeaways:\n${bulletin.takeaways.join("\n")}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Daily Audio Weather Bulletin
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {langConfig.name} ({langConfig.nativeName})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Personalized 45-second morning & evening audio briefing synthesized directly in {langConfig.name}
            </p>
          </div>
        </div>

        {/* Speed & Share Actions */}
        <div className="flex items-center gap-2">
          {/* Rate Selector */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value={0.85} className="bg-slate-900 text-white">0.85x</option>
              <option value={1.0} className="bg-slate-900 text-white">1.0x</option>
              <option value={1.15} className="bg-slate-900 text-white">1.15x</option>
              <option value={1.3} className="bg-slate-900 text-white">1.3x</option>
            </select>
          </div>

          <button
            onClick={handleCopyScript}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? "Copied!" : "Copy Text"}</span>
          </button>
        </div>
      </div>

      {/* Audio Player Broadcast Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-lg shrink-0 ${
                isPlaying
                  ? "bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600"
                  : "bg-cyan-500 text-slate-950 shadow-cyan-500/30 hover:bg-cyan-400"
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{bulletin.title}</span>
                {isPlaying && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPlaying ? "Broadcasting live audio in " + langConfig.name : "Press play to listen to audio briefing"}
              </p>
            </div>
          </div>

          {/* Equalizer Animation Bars */}
          <div className="flex items-end gap-1.5 h-8 px-4 py-1 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlaying ? "bg-cyan-400 animate-pulse" : "bg-slate-700"
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, Math.round(h * (0.4 + Math.random() * 0.6)))}%` : "20%",
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 4 Takeaway Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <Sun className="w-4 h-4" />
            <span>Thermal Span</span>
          </div>
          <div className="text-sm font-semibold text-slate-200">{bulletin.takeaways[0]}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
            <CloudRain className="w-4 h-4" />
            <span>Rain Exposure</span>
          </div>
          <div className="text-sm font-semibold text-slate-200">{bulletin.takeaways[1]}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <Wind className="w-4 h-4" />
            <span>Commute Safety</span>
          </div>
          <div className="text-sm font-semibold text-slate-200">{bulletin.takeaways[2]}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Air Health</span>
          </div>
          <div className="text-sm font-semibold text-slate-200">{bulletin.takeaways[3]}</div>
        </div>
      </div>

      {/* Native Language Transcript Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider text-slate-300">
            Native Language Transcript ({langConfig.nativeName})
          </span>
          <span className="text-[11px] font-mono text-cyan-400">BCP-47: {langConfig.speechCode}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          {bulletin.script}
        </p>
      </div>
    </div>
  );
};
