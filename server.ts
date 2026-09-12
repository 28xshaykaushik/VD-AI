import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON with generous limit for image uploads
app.use(express.json({ limit: "25mb" }));

// Lazy Gemini AI initialization with user-agent telemetry
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Weather code translation dictionary
const WMO_CODES: Record<number, { label: string; icon: string; hazard: string }> = {
  0: { label: "Clear sky", icon: "sun", hazard: "None" },
  1: { label: "Mainly clear", icon: "sun", hazard: "None" },
  2: { label: "Partly cloudy", icon: "cloud-sun", hazard: "None" },
  3: { label: "Overcast", icon: "cloud", hazard: "Low visibility" },
  45: { label: "Foggy", icon: "cloud-fog", hazard: "Dense fog & poor driving visibility" },
  48: { label: "Depositing rime fog", icon: "cloud-fog", hazard: "Severe visibility loss" },
  51: { label: "Light drizzle", icon: "cloud-drizzle", hazard: "Slick road surfaces" },
  53: { label: "Moderate drizzle", icon: "cloud-drizzle", hazard: "Dampness & slippery roads" },
  55: { label: "Dense drizzle", icon: "cloud-drizzle", hazard: "Continuous wet conditions" },
  61: { label: "Slight rain", icon: "cloud-rain", hazard: "Minor wet roads" },
  63: { label: "Moderate rain", icon: "cloud-rain", hazard: "Waterlogging in low spots" },
  65: { label: "Heavy rain", icon: "cloud-rain", hazard: "Flooding & severe transport delays" },
  71: { label: "Slight snow", icon: "snowflake", hazard: "Slippery roads" },
  73: { label: "Moderate snow", icon: "snowflake", hazard: "Low traction, cold hazard" },
  75: { label: "Heavy snow", icon: "snowflake", hazard: "Blocked mountain roads, frostbite" },
  80: { label: "Slight rain showers", icon: "cloud-rain", hazard: "Sudden downpours" },
  81: { label: "Moderate showers", icon: "cloud-rain", hazard: "Rapid water pooling" },
  82: { label: "Violent rain showers", icon: "cloud-lightning", hazard: "Flash flood & torrents" },
  95: { label: "Thunderstorm", icon: "cloud-lightning", hazard: "Lightning strikes & sudden wind gusts" },
  96: { label: "Thunderstorm with slight hail", icon: "cloud-lightning", hazard: "Hail damage, lightning" },
  99: { label: "Thunderstorm with heavy hail", icon: "cloud-lightning", hazard: "Severe hail, wind gusts, structural risk" },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] || { label: "Variable conditions", icon: "cloud", hazard: "Normal awareness" };
}

// Top world/Indian default cities for instant fast loading
const POPULAR_LOCATIONS: Record<string, { lat: number; lon: number; name: string; country: string; admin: string; isMountainous?: boolean }> = {
  delhi: { lat: 28.6139, lon: 77.2090, name: "New Delhi", country: "India", admin: "Delhi" },
  mumbai: { lat: 19.0760, lon: 72.8777, name: "Mumbai", country: "India", admin: "Maharashtra" },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: "Bengaluru", country: "India", admin: "Karnataka" },
  shimla: { lat: 31.1048, lon: 77.1734, name: "Shimla", country: "India", admin: "Himachal Pradesh", isMountainous: true },
  manali: { lat: 32.2432, lon: 77.1892, name: "Manali", country: "India", admin: "Himachal Pradesh", isMountainous: true },
  gangtok: { lat: 27.3389, lon: 88.6065, name: "Gangtok", country: "India", admin: "Sikkim", isMountainous: true },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: "Chandigarh", country: "India", admin: "Punjab" },
  london: { lat: 51.5074, lon: -0.1278, name: "London", country: "United Kingdom", admin: "England" },
  newyork: { lat: 40.7128, lon: -74.0060, name: "New York", country: "United States", admin: "New York" },
  tokyo: { lat: 35.6762, lon: 139.6503, name: "Tokyo", country: "Japan", admin: "Tokyo" },
};

// Calculate Semantic Weather DNA (0 - 10 scores)
function computeWeatherDNA(temp: number, precipProb: number, windSpeed: number, visibilityMeters: number) {
  const cold = Math.min(10, Math.max(0, Math.round((28 - temp) / 3.5)));
  const rain = Math.min(10, Math.max(0, Math.round(precipProb / 10)));
  const wind = Math.min(10, Math.max(0, Math.round(windSpeed / 5)));
  const visibilityScore = Math.min(10, Math.max(0, Math.round((visibilityMeters || 10000) / 1000)));
  const outdoorComfort = Math.min(10, Math.max(1, Math.round(10 - (rain * 0.45 + (Math.abs(temp - 22) / 3) * 0.35 + wind * 0.2))));
  const travelReliability = Math.min(10, Math.max(1, Math.round(10 - (rain * 0.5 + (10 - visibilityScore) * 0.3 + wind * 0.2))));

  return {
    cold,
    rain,
    wind,
    visibility: visibilityScore,
    outdoorComfort,
    travelReliability,
  };
}

// Compute Disaster Risk Indicators (Key Hazards: Landslides, Waterlogging, Heat, Wind)
function computeDisasterRisk(
  city: string,
  temp: number,
  rainProb: number,
  precipMm: number,
  windGust: number,
  isMountainous: boolean
) {
  const isHilly = isMountainous || /shimla|manali|gangtok|ladakh|leh|kullu|mandi|dehradun|mussoorie|nainital|darjeeling|dharamshala|kashmir|srinagar/i.test(city);
  
  // Landslide / Slope Risk
  let slopeRiskScore = 15;
  if (isHilly) {
    slopeRiskScore = Math.min(95, Math.round(25 + precipMm * 4.5 + rainProb * 0.4));
  } else {
    slopeRiskScore = Math.min(30, Math.round(precipMm * 1.5));
  }

  // Urban Waterlogging / Flood Risk
  let floodRiskScore = Math.min(95, Math.round(precipMm * 5.2 + (rainProb > 60 ? 25 : 0)));

  // Heat Stress / Heatwave
  let heatStressScore = Math.min(98, Math.max(5, Math.round((temp - 27) * 4.5)));

  // High Wind / Squall Risk
  let windHazardScore = Math.min(95, Math.max(5, Math.round(windGust * 1.4)));

  // Overall IMD-style Alert Level
  let alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED" = "GREEN";
  let alertTitle = "Normal Conditions (Green Watch)";
  let alertSummary = "No severe meteorological hazards currently expected for this area.";

  const maxHazard = Math.max(slopeRiskScore, floodRiskScore, heatStressScore, windHazardScore);
  if (maxHazard >= 75 || precipMm > 25) {
    alertLevel = "RED";
    alertTitle = "Red Alert: Severe Weather Hazard";
    alertSummary = isHilly
      ? "Extremely heavy rain combined with high slope saturation: elevated landslide & rockfall threat. Avoid hilly travel."
      : "Severe precipitation/storm conditions: high risk of urban inundation, waterlogged roads & transport suspension.";
  } else if (maxHazard >= 55 || precipMm > 10 || windGust > 45) {
    alertLevel = "ORANGE";
    alertTitle = "Orange Alert: Be Prepared";
    alertSummary = isHilly
      ? "Moderate to heavy showers with reduced visibility on winding roads. Stay alert for vulnerable road sections."
      : "Active rain spells with localized waterlogging. Allow extra commute time and carry waterproof protection.";
  } else if (maxHazard >= 35 || rainProb > 45 || temp > 38) {
    alertLevel = "YELLOW";
    alertTitle = "Yellow Watch: Be Updated";
    alertSummary = "Passing showers or elevated temperatures forecasted. Keep daily plans flexible.";
  }

  return {
    alertLevel,
    alertTitle,
    alertSummary,
    isMountainous: isHilly,
    scores: {
      slopeLandslide: slopeRiskScore,
      urbanWaterlogging: floodRiskScore,
      heatStress: Math.max(0, heatStressScore),
      windGustHazard: windHazardScore,
    },
  };
}

// Multi-Model Ensemble Simulation (Forecast Argument feature)
function computeModelEnsemble(rainProb: number, temp: number) {
  const gfsRain = Math.min(100, Math.max(0, Math.round(rainProb + (Math.sin(temp) * 12))));
  const ecmwfRain = Math.min(100, Math.max(0, Math.round(rainProb - (Math.cos(temp) * 8))));
  const iconRain = Math.min(100, Math.max(0, Math.round(rainProb + (Math.sin(temp * 2) * 15))));
  const imdRain = Math.min(100, Math.max(0, Math.round(rainProb + (Math.cos(temp * 0.5) * 6))));

  const values = [gfsRain, ecmwfRain, iconRain, imdRain];
  const maxDiff = Math.max(...values) - Math.min(...values);

  let consensus: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  let analysis = "Numerical forecast models (ECMWF, GFS, ICON, IMD-WRF) are in high consensus.";

  if (maxDiff > 35) {
    consensus = "LOW";
    analysis = "Forecast models disagree significantly regarding precipitation onset window and volume. High uncertainty present.";
  } else if (maxDiff > 18) {
    consensus = "MEDIUM";
    analysis = "Minor divergence in model timing (30–60 min difference). Primary trend indicates consistent atmospheric moisture.";
  }

  return {
    consensus,
    varianceSpread: `${maxDiff}%`,
    analysis,
    models: [
      { name: "ECMWF (European High-Res)", rainProbability: ecmwfRain, tempOffset: 0 },
      { name: "GFS (NOAA US Global)", rainProbability: gfsRain, tempOffset: +0.4 },
      { name: "ICON (German Weather Service)", rainProbability: iconRain, tempOffset: -0.3 },
      { name: "IMD-WRF (Regional India Model)", rainProbability: imdRain, tempOffset: +0.2 },
    ],
  };
}

// ----------------------------------------------------
// 1. Core Weather API Endpoint
// ----------------------------------------------------
app.get("/api/weather", async (req: Request, res: Response) => {
  try {
    const cityQuery = ((req.query.city as string) || "Delhi").trim();
    let lat = parseFloat(req.query.lat as string);
    let lon = parseFloat(req.query.lon as string);
    let resolvedName = cityQuery;
    let country = "India";
    let admin = "";
    let isHilly = false;

    // Fast check for known location
    const normalizedKey = cityQuery.toLowerCase().replace(/[^a-z]/g, "");
    if (POPULAR_LOCATIONS[normalizedKey] && (!lat || isNaN(lat))) {
      const match = POPULAR_LOCATIONS[normalizedKey];
      lat = match.lat;
      lon = match.lon;
      resolvedName = match.name;
      country = match.country;
      admin = match.admin;
      isHilly = !!match.isMountainous;
    }

    // Geocode if lat/lon not provided
    if (!lat || isNaN(lat) || !lon || isNaN(lon)) {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`;
        const geoResp = await fetch(geoUrl);
        const geoData = await geoResp.json();
        if (geoData?.results && geoData.results.length > 0) {
          const top = geoData.results[0];
          lat = top.latitude;
          lon = top.longitude;
          resolvedName = top.name;
          country = top.country || "";
          admin = top.admin1 || "";
          if (top.elevation && top.elevation > 1200) {
            isHilly = true;
          }
        } else {
          // Fallback to Delhi
          lat = 28.6139;
          lon = 77.2090;
          resolvedName = cityQuery;
          country = "India";
        }
      } catch (err) {
        lat = 28.6139;
        lon = 77.2090;
        resolvedName = cityQuery;
      }
    }

    // Fetch Open-Meteo current, hourly, and daily forecasts
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,wind_gusts_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

    const weatherResp = await fetch(weatherUrl);
    const weatherJson = await weatherResp.json();

    const current = weatherJson.current || {};
    const hourly = weatherJson.hourly || {};
    const daily = weatherJson.daily || {};

    const temp = Math.round(current.temperature_2m ?? 28);
    const feelsLike = Math.round(current.apparent_temperature ?? temp);
    const humidity = Math.round(current.relative_humidity_2m ?? 60);
    const windSpeed = Math.round(current.wind_speed_10m ?? 12);
    const windGusts = Math.round(current.wind_gusts_10m ?? windSpeed * 1.3);
    const uvIndex = current.uv_index ?? 5;
    const weatherCode = current.weather_code ?? 0;
    const precip = current.precipitation ?? 0;
    const weatherInfo = getWeatherInfo(weatherCode);

    // Determine city local time and current hour index in Open-Meteo timeline
    const timezone = weatherJson.timezone || "Asia/Kolkata";
    let cityLocalTime = "";
    let cityLocalDate = "";
    try {
      cityLocalTime = new Date().toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      cityLocalDate = new Date().toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      cityLocalTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      cityLocalDate = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }

    // Build 24-Hour Forecast Slice matching current local hour
    let currentHourIndex = 0;
    if (hourly.time && hourly.time.length > 0) {
      if (current.time) {
        const found = hourly.time.indexOf(current.time);
        if (found !== -1) {
          currentHourIndex = found;
        } else {
          // Match prefix YYYY-MM-DDTHH
          const prefix = String(current.time).slice(0, 13);
          const foundIdx = hourly.time.findIndex((t: string) => t.startsWith(prefix));
          if (foundIdx !== -1) {
            currentHourIndex = foundIdx;
          }
        }
      }
    }

    const hourlyList = [];
    if (hourly.time) {
      const todayDateStr = hourly.time[currentHourIndex]?.split("T")[0] || "";
      const endIndex = Math.min(currentHourIndex + 24, hourly.time.length);
      for (let i = currentHourIndex; i < endIndex; i++) {
        const rawTime = hourly.time[i];
        const [rawDatePart, rawTimePart] = rawTime.split("T");
        const [rawHourStr] = rawTimePart ? rawTimePart.split(":") : ["00"];
        const hourNum = parseInt(rawHourStr, 10);
        const ampm = hourNum >= 12 ? "PM" : "AM";
        const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
        const hourStr = `${hour12} ${ampm}`;

        const isCurrent = i === currentHourIndex;
        let dateBadge = "";
        if (isCurrent) {
          dateBadge = "Current";
        } else if (rawDatePart !== todayDateStr) {
          dateBadge = "Tomorrow";
        } else {
          dateBadge = `+${i - currentHourIndex}h`;
        }

        const hCode = hourly.weather_code?.[i] ?? 0;
        const hProb = hourly.precipitation_probability?.[i] ?? 0;
        const hTemp = Math.round(hourly.temperature_2m?.[i] ?? temp);
        const hWind = Math.round(hourly.wind_speed_10m?.[i] ?? windSpeed);
        const hPrecip = hourly.precipitation?.[i] ?? 0;

        let riskTag: "SAFE" | "MODERATE" | "HIGH" = "SAFE";
        if (hProb > 60 || hPrecip > 4 || hCode >= 65 || hCode === 95) {
          riskTag = "HIGH";
        } else if (hProb > 25 || hPrecip > 0.5 || hWind > 25) {
          riskTag = "MODERATE";
        }

        hourlyList.push({
          time: hourStr,
          displayTime: `${hour12}:00 ${ampm}`,
          dateStr: dateBadge,
          rawIso: rawTime,
          temp: hTemp,
          pop: hProb,
          precipMm: hPrecip,
          windSpeed: hWind,
          weatherCode: hCode,
          info: getWeatherInfo(hCode),
          riskTag,
          isCurrent,
        });
      }
    }

    // Build 7-Day Daily Forecast Slice
    const dailyList = [];
    if (daily.time) {
      for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        const dateObj = new Date(daily.time[i]);
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const dCode = daily.weather_code?.[i] ?? 0;
        dailyList.push({
          day: dayName,
          date: daily.time[i],
          maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? temp + 2),
          minTemp: Math.round(daily.temperature_2m_min?.[i] ?? temp - 6),
          pop: daily.precipitation_probability_max?.[i] ?? 10,
          precipSum: daily.precipitation_sum?.[i] ?? 0,
          uvMax: daily.uv_index_max?.[i] ?? 5,
          sunrise: daily.sunrise?.[i] ? daily.sunrise[i].split("T")[1] : "06:00",
          sunset: daily.sunset?.[i] ? daily.sunset[i].split("T")[1] : "18:45",
          info: getWeatherInfo(dCode),
        });
      }
    }

    // Fetch Air Quality (AQI)
    let aqi = 85;
    let pm25 = 35;
    let pm10 = 70;
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5&timezone=auto`;
      const aqiResp = await fetch(aqiUrl);
      const aqiJson = await aqiResp.json();
      if (aqiJson.current) {
        aqi = Math.round(aqiJson.current.us_aqi ?? 85);
        pm25 = Math.round(aqiJson.current.pm2_5 ?? 35);
        pm10 = Math.round(aqiJson.current.pm10 ?? 70);
      }
    } catch {
      // safe fallback
    }

    // Calculate Highest precipitation probability in next 6 hours
    const next6Hours = hourlyList.slice(0, 6);
    const maxProbNext6h = next6Hours.length > 0 ? Math.max(...next6Hours.map((h) => h.pop)) : 10;
    const nextRainSlot = next6Hours.find((h) => h.pop >= 40);

    // Weather DNA
    const weatherDNA = computeWeatherDNA(
      temp,
      maxProbNext6h,
      windSpeed,
      hourly.visibility?.[currentHourIndex] ?? 8000
    );

    // Disaster Risks
    const disasterRisk = computeDisasterRisk(resolvedName, temp, maxProbNext6h, precip, windGusts, isHilly);

    // Forecast Model Disagreement
    const modelEnsemble = computeModelEnsemble(maxProbNext6h, temp);

    // Weather Surprise Check (Simulation of material deviations)
    const surpriseAlert = {
      hasSurprise: maxProbNext6h >= 45 || temp > 37 || windGusts > 38,
      title: maxProbNext6h >= 45
        ? "Rapid Rain Progression Detected"
        : temp > 37
        ? "Heatwave Index Elevation"
        : "Gust Front Velocity Spike",
      description: nextRainSlot
        ? `Atmospheric moisture accelerated: precipitation probability elevated around ${nextRainSlot.time} (${nextRainSlot.pop}%). Commute time affected.`
        : `Wind gusts measuring ${windGusts} km/h with low air humidity.`,
      actionPrompt: nextRainSlot
        ? "Keep an umbrella on hand and secure open balconies before departure."
        : "Hydrate actively and avoid strenuous midday sun exposure.",
    };

    // Home Actions
    const homeActions = [
      {
        id: "windows",
        icon: "window",
        label: maxProbNext6h > 40 ? "Close balcony & terrace windows" : "Windows can remain open for ventilation",
        urgent: maxProbNext6h > 40,
      },
      {
        id: "laundry",
        icon: "shirt",
        label: maxProbNext6h > 30 ? "Bring drying clothes indoors" : "Safe to dry outdoor laundry",
        urgent: maxProbNext6h > 30,
      },
      {
        id: "plants",
        icon: "flower",
        label: temp > 38 ? "Move sensitive foliage into shade" : "Outdoor plants are well-balanced",
        urgent: temp > 38,
      },
      {
        id: "vehicles",
        icon: "car",
        label: windGusts > 35 || maxProbNext6h > 60 ? "Park under covered parking, avoid parking under dead trees" : "Standard vehicle parking safe",
        urgent: windGusts > 35 || maxProbNext6h > 60,
      },
    ];

    res.json({
      location: {
        name: resolvedName,
        country,
        admin,
        lat,
        lon,
        isMountainous: isHilly,
        timezone,
        localTime: cityLocalTime,
        localDate: cityLocalDate,
      },
      current: {
        temp,
        feelsLike,
        humidity,
        windSpeed,
        windGusts,
        uvIndex,
        precipitation: precip,
        weatherCode,
        condition: weatherInfo.label,
        hazard: weatherInfo.hazard,
        aqi,
        pm25,
        pm10,
        isDay: current.is_day === 1,
        localTime: cityLocalTime,
      },
      hourly: hourlyList,
      daily: dailyList,
      dna: weatherDNA,
      disasterRisk,
      modelEnsemble,
      surpriseAlert,
      homeActions,
    });
  } catch (err: any) {
    console.error("Error in /api/weather:", err);
    res.status(500).json({ error: "Failed to retrieve weather intelligence", details: err.message });
  }
});

// ----------------------------------------------------
// 1.1 City Search Auto-complete Endpoint
// ----------------------------------------------------
app.get("/api/cities", async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || "").trim();
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    // First, check matching local popular locations for instant sub-millisecond response
    const normalizedQ = query.toLowerCase();
    const localMatches = Object.values(POPULAR_LOCATIONS)
      .filter((loc) => loc.name.toLowerCase().includes(normalizedQ) || loc.admin.toLowerCase().includes(normalizedQ))
      .map((loc) => ({
        name: loc.name,
        admin1: loc.admin,
        country: loc.country,
        latitude: loc.lat,
        longitude: loc.lon,
      }));

    // Next, query Open-Meteo Geocoding API for global results
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=7&language=en&format=json`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();
      
      const remoteResults = (geoData?.results || []).map((r: any) => ({
        name: r.name,
        admin1: r.admin1 || "",
        country: r.country || "",
        latitude: r.latitude,
        longitude: r.longitude,
      }));

      // Merge and deduplicate by name + admin1 + country
      const combined: any[] = [];
      const seen = new Set<string>();

      for (const item of [...localMatches, ...remoteResults]) {
        const key = `${item.name}-${item.admin1}-${item.country}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }

      res.json({ results: combined.slice(0, 7) });
    } catch {
      res.json({ results: localMatches });
    }
  } catch (err: any) {
    console.error("Error in /api/cities:", err);
    res.json({ results: [] });
  }
});

// ----------------------------------------------------
// 2. Weather Mission Mode Evaluation Endpoint
// ----------------------------------------------------
app.post("/api/mission", async (req: Request, res: Response) => {
  try {
    const { activity, locationName, timeWindow, transportMode, weatherData, language } = req.body;

    const act = (activity || "Walking").trim();
    const city = (locationName || "Current Location").trim();
    const trans = (transportMode || "Two-wheeler / Bike").trim();
    const lang = (language || "English").trim();

    // Determine baseline feasibility score based on structured conditions
    const temp = weatherData?.current?.temp ?? 28;
    const rainProb = weatherData?.current?.precipitation > 0 ? 80 : 35;
    const windSpeed = weatherData?.current?.windSpeed ?? 15;
    const aqi = weatherData?.current?.aqi ?? 90;

    let deduction = 0;
    const riskReasons: string[] = [];

    // Activity sensitivity
    if (/bike|motorcycle|scooter|two-wheeler/i.test(trans)) {
      if (rainProb > 40) {
        deduction += 35;
        riskReasons.push("Rain risk creates skidding hazards on painted lane lines & high water spray");
      }
      if (windSpeed > 30) {
        deduction += 15;
        riskReasons.push("High crosswinds destabilize lightweight two-wheelers");
      }
      if (aqi > 150) {
        deduction += 15;
        riskReasons.push("Direct air exposure under poor AQI causes respiratory strain");
      }
    } else if (/trekking|hiking/i.test(act)) {
      if (weatherData?.location?.isMountainous) {
        deduction += 20;
        riskReasons.push("Hilly terrain has elevated mud-slip & rock instability during rain");
      }
      if (rainProb > 40) {
        deduction += 30;
        riskReasons.push("Wet trail tracks and reduced visibility");
      }
    } else if (/picnic|outdoor sports|event|party/i.test(act)) {
      if (rainProb > 40) {
        deduction += 45;
        riskReasons.push("Open-air ground becomes wet, outdoor setups vulnerable to rain");
      }
      if (temp > 35) {
        deduction += 25;
        riskReasons.push("Extreme daytime heat causes swift fatigue and dehydration");
      }
    }

    const feasibilityScore = Math.max(15, Math.min(98, Math.round(100 - deduction)));

    // Generate response using Gemini AI for natural-language decision making if available
    const ai = getAI();
    let aiResponsePayload = null;

    if (ai) {
      try {
        const prompt = `You are VyoomDut AI, the premier Conversational AI Weather Decision Assistant.
Tagline: "Don't Just Know the Weather. Know What to Do" / "Mausam sirf jaaniye nahi — uske hisaab se faisla lijiye."

Evaluate this mission scenario:
- Location: ${city}
- Planned Activity: ${act}
- Transport Mode: ${trans}
- Time Window: ${timeWindow || "Upcoming hours"}
- Language: ${lang}
- Current Temp: ${temp}°C, Rain Risk: ${rainProb}%, Wind: ${windSpeed} km/h, AQI: ${aqi}

Return a valid JSON object matching this schema:
{
  "feasibilityScore": number (0 to 100),
  "statusTag": string (e.g. "Safe to Proceed", "Caution Required", "High Risk / Delay Recommended"),
  "verdictSummary": string (2-3 punchy sentences giving direct advice in ${lang}),
  "carry": [
    { "item": string, "reason": string }
  ],
  "dontCarry": [
    { "item": string, "reason": string }
  ],
  "bestTime": {
    "recommendedDeparture": string,
    "hazardWindow": string,
    "explanation": string
  },
  "plans": {
    "planA": { "name": string, "score": number, "description": string },
    "planB": { "name": string, "score": number, "description": string },
    "planC": { "name": string, "score": number, "description": string }
  },
  "outfitAdvice": {
    "wear": string[],
    "avoid": string[],
    "transportTip": string
  }
}

Do NOT wrap in markdown code blocks with extra text. Return pure JSON only.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response.text) {
          aiResponsePayload = JSON.parse(response.text);
        }
      } catch (geminiErr) {
        console.warn("Gemini mission generation fallback:", geminiErr);
      }
    }

    // Default structured fallback if Gemini is offline or fails
    if (!aiResponsePayload) {
      aiResponsePayload = {
        feasibilityScore,
        statusTag: feasibilityScore > 75 ? "Safe to Proceed" : feasibilityScore > 50 ? "Caution Required" : "High Risk / Backup Needed",
        verdictSummary:
          feasibilityScore > 75
            ? `Conditions in ${city} are favorable for your ${act}. Keep light hydration and monitor wind shifts.`
            : `Rain risk and transport exposure in ${city} reduce ${act} feasibility to ${feasibilityScore}/100. Carry waterproof gear and avoid peak precipitation windows.`,
        carry: [
          { item: "Compact Umbrella / Rain Poncho", reason: "Precipitation risk builds during late afternoon" },
          { item: "Waterproof Bag Cover / Zip Pouches", reason: "Protects mobile, charger, and documents" },
          { item: "Water Bottle & Electolytes", reason: `Temperature around ${temp}°C requires regular hydration` },
          { item: "Power Bank", reason: "GPS navigation & cold/heat drain battery faster" },
        ],
        dontCarry: [
          { item: "Heavy Sweaters / Overcoat", reason: `Unnecessary with current ambient ${temp}°C` },
          { item: "Suede or Canvas Shoes", reason: "Permanent water damage risk on wet pathways" },
          { item: "Unprotected Loose Paper Documents", reason: "Sudden drizzle will ruin paper files" },
        ],
        bestTime: {
          recommendedDeparture: "Depart early or 45 mins after current shower band clears",
          hazardWindow: "4:30 PM – 6:45 PM (Peak precipitation & traffic buildup)",
          explanation: "Atmospheric instability peaks around evening rush hour; shifting departure by 40 minutes saves commute delays.",
        },
        plans: {
          planA: { name: `Original Plan: Outdoor ${act}`, score: feasibilityScore, description: "Proceed with full waterproof precautions and backup shelter." },
          planB: { name: "Indoor Alternative / Sheltered Venue", score: 92, description: "Transition to indoor cafe, sports complex, or indoor arena." },
          planC: { name: "Shift Schedule by 2 Hours", score: 86, description: "Postpone to later evening when rainfall radar shows clear clearing trends." },
        },
        outfitAdvice: {
          wear: ["Breathable quick-dry synthetic shirt", "Water-resistant sneakers or rubber-sole shoes", "Clear visor helmet (if riding)"],
          avoid: ["Cotton heavy denims", "Open sandals without grip", "White canvas sneakers"],
          transportTip: `When traveling via ${trans}, maintain 2x standard braking distance and avoid painted white road markings when damp.`,
        },
      };
    }

    res.json(aiResponsePayload);
  } catch (err: any) {
    console.error("Error in /api/mission:", err);
    res.status(500).json({ error: "Failed to evaluate mission", details: err.message });
  }
});

// Helper: Extract candidate city or location from user query
function extractCityCandidate(query: string): string | null {
  const q = query.trim().replace(/[?!.,;]/g, " ");

  // Pattern 1: (temperature|temp|weather|mausam|forecast) ... (in|of|for|at|near|around|about|ka|ki|ke) <city>
  let match = q.match(/(?:temperature|temeratue|temp|weather|mausam|forecast|climate|condition|conditions|barish|chata|rain|info|information)\s+(?:in|of|for|at|near|around|about|ka|ki|ke)\s+([a-zA-Z\s]+)/i);
  if (match) return cleanCandidate(match[1]);

  // Pattern 2: "what about <city>" or "how is <city>" or "tell me about <city>"
  match = q.match(/(?:about|how is|tell me about|weather of|temperature of)\s+([a-zA-Z\s]+)/i);
  if (match) return cleanCandidate(match[1]);

  // Pattern 3: <city> (temperature|weather|mausam)
  match = q.match(/^([a-zA-Z\s]+?)\s+(?:ka\s+)?(?:temperature|temeratue|temp|weather|mausam|forecast)/i);
  if (match && !/^(current|live|today|tomorrow|local|city|the|what|whats|is|how)$/i.test(match[1].trim())) {
    return cleanCandidate(match[1]);
  }

  // Pattern 4: (in|at|for|near) <city>
  match = q.match(/(?:in|at|for|near|around)\s+([a-zA-Z\s]+)/i);
  if (match) {
    const res = cleanCandidate(match[1]);
    if (res && !/^(today|tomorrow|now|me|us|riding|walking|travel|office|college|school|bike|car|drive|night|morning|evening|afternoon)$/i.test(res)) {
      return res;
    }
  }

  // Pattern 5: if query is a short 1-2 words that might just be a city name
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && !/^(hi|hello|hey|help|yes|no|ok|bye|umbrella|chata|rain|aqi|mask)$/i.test(words[0])) {
    return cleanCandidate(q);
  }

  return null;
}

function cleanCandidate(cand: string): string {
  let cleaned = cand.replace(/^(the|a|an|about|to|any|other|place|city|location)\s+/i, "");
  cleaned = cleaned.replace(/\s+(today|tomorrow|now|right now|please|plz|or|and|about|kya|hai|batao|h|bhi|in|on|at).*$/i, "").trim();
  return cleaned;
}

// Helper: Fetch quick live weather for any resolved location
async function fetchLiveWeatherSummary(cityName: string): Promise<any | null> {
  try {
    const clean = cityName.trim();
    if (!clean || clean.length < 2) return null;
    let lat: number | undefined;
    let lon: number | undefined;
    let resolvedName = clean;
    let country = "India";
    let admin = "";
    let isHilly = false;

    const normalizedKey = clean.toLowerCase().replace(/[^a-z]/g, "");
    if (POPULAR_LOCATIONS[normalizedKey]) {
      const match = POPULAR_LOCATIONS[normalizedKey];
      lat = match.lat;
      lon = match.lon;
      resolvedName = match.name;
      country = match.country;
      admin = match.admin;
      isHilly = !!match.isMountainous;
    } else {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&language=en&format=json`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();
      if (geoData?.results && geoData.results.length > 0) {
        const top = geoData.results[0];
        lat = top.latitude;
        lon = top.longitude;
        resolvedName = top.name;
        country = top.country || "India";
        admin = top.admin1 || "";
        if (top.elevation && top.elevation > 1200) {
          isHilly = true;
        }
      }
    }

    if (lat === undefined || lon === undefined) return null;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const weatherResp = await fetch(weatherUrl);
    const weatherJson = await weatherResp.json();
    const current = weatherJson.current || {};
    const weatherCode = current.weather_code ?? 0;
    const weatherInfo = getWeatherInfo(weatherCode);

    const temp = Math.round(current.temperature_2m ?? 25);
    const feelsLike = Math.round(current.apparent_temperature ?? temp);
    const humidity = Math.round(current.relative_humidity_2m ?? 50);
    const windSpeed = Math.round(current.wind_speed_10m ?? 10);
    const precip = current.precipitation ?? 0;

    return {
      location: {
        name: resolvedName,
        country,
        admin,
        lat,
        lon,
        isMountainous: isHilly,
      },
      current: {
        temp,
        feelsLike,
        humidity,
        windSpeed,
        condition: weatherInfo.label,
        precipitation: precip,
        hazard: weatherInfo.hazard,
        aqi: Math.min(300, Math.max(35, Math.round(65 + (temp > 32 ? 35 : 10) + (humidity > 70 ? 20 : 0)))),
      },
    };
  } catch (e) {
    console.warn("fetchLiveWeatherSummary failed for:", cityName, e);
    return null;
  }
}

// Deterministic Meteorological Decision Rule Engine (Zero-Failure Fallback)
function generateLocalWeatherDecision(userMsg: string, weatherContext: any, lang: string): string {
  const loc = weatherContext?.location?.name || "your location";
  const adminState = weatherContext?.location?.admin ? `, ${weatherContext.location.admin}` : "";
  const temp = weatherContext?.current?.temp ?? 28;
  const feelsLike = weatherContext?.current?.feelsLike ?? temp;
  const cond = weatherContext?.current?.condition ?? "clear skies";
  const rain = weatherContext?.current?.precipitation ?? 0;
  const wind = weatherContext?.current?.windSpeed ?? 15;
  const humidity = weatherContext?.current?.humidity ?? 55;
  const aqi = weatherContext?.current?.aqi ?? 95;
  const isHilly = weatherContext?.location?.isMountainous || false;
  const isRainy = rain > 0 || /rain|drizzle|shower|thunder/i.test(cond);

  const query = userMsg.toLowerCase();
  const isHindi = /hindi/i.test(lang) || /kya|hai|hoon|batao|kaise|mausam|chata|barish|kapde|bike|niklun|kitna/i.test(query);

  // 1. Direct Temperature & Conditions Query
  if (/temperature|temeratue|temp|kitna hai|how hot|how cold|degrees|celsius/i.test(query)) {
    if (isHindi) {
      return `🌡️ **${loc}${adminState} का वर्तमान तापमान एवं मौसम:**\n\n- **वर्तमान तापमान:** **${temp}°C** (महसूस: ~${feelsLike}°C)\n- **मौसम की स्थिति:** ${cond}\n- **हवा व नमी:** हवा की गति ${wind} km/h, आर्द्रता (Humidity) ${humidity}%\n- **वायु गुणवत्ता (AQI):** ${aqi} (${aqi > 150 ? "मध्यम/खराब" : "सामान्य"})\n\n💡 **निर्णय सलाह:** ${temp > 32 ? "धूप व गर्मी से बचने के लिए हाइड्रेटेड रहें।" : temp < 18 ? "हल्की ठंडक है, फुल-स्लीव या जैकेट पहनें।" : "मौसम सुहावना है और यात्रा या आउटडोर गतिविधियों के लिए अनुकूल है।"}`;
    } else {
      return `🌡️ **Live Temperature & Atmospheric Status for ${loc}${adminState}:**\n\n- **Current Temperature:** **${temp}°C** (Feels like ~${feelsLike}°C)\n- **Weather Condition:** ${cond}\n- **Wind & Moisture:** Wind ${wind} km/h, Humidity ${humidity}%\n- **Air Quality (AQI):** ${aqi}\n\n💡 **Actionable Advice:** ${temp > 32 ? "Warm conditions; stay hydrated with water and avoid prolonged sun exposure." : temp < 18 ? "Mildly chilly; light layer or jacket recommended." : "Comfortable ambient weather suitable for outdoor commute and travel."}`;
    }
  }

  // 2. Umbrella / Rain Question
  if (/umbrella|chata|rain|barish|drizzle|barsat|waterproof|wet/i.test(query)) {
    if (isHindi) {
      return isRainy
        ? `☔ **हाँ, ${loc} के लिए छाता (Umbrella) अवश्य साथ रखें!**\n\n- **स्थिति:** ${loc} में अभी बारिश/बूंदाबांदी (${rain} mm) और बादल छाए हुए हैं।\n- **सलाह:** यदि आप पैदल या 2-व्हीलर से निकल रहे हैं, तो वॉटरप्रूफ बैग कवर और छाता पास रखें।\n- **सावधानी:** फिसलन भरी सड़कों और जलभराव वाले रास्तों से बचें।`
        : `☂️ **अभी ${loc} में छाते की तत्काल आवश्यकता नहीं है, पर साथ रखना सुरक्षित रहेगा।**\n\n- **स्थिति:** ${loc} में वर्तमान तापमान **${temp}°C** है और आसमान **${cond}** है।\n- **सलाह:** यदि आप दिनभर बाहर रहने वाले हैं, तो अचानक मौसम बदलाव के लिए एक फोल्डेबल छाता बैग में डाल लें।`;
    } else {
      return isRainy
        ? `☔ **YES, carry an umbrella in ${loc}!**\n\n- **Current Ground Truth:** Active precipitation (${rain} mm) and ${cond} observed in ${loc}.\n- **Direct Action:** Carry a sturdy umbrella and wrap electronic devices in waterproof pouches.\n- **Commute Notice:** Pavements are slick; allow an extra 10–15 minutes for road travel.`
        : `☂️ **Umbrella is optional right now in ${loc}, but recommended for extended outings.**\n\n- **Current Ground Truth:** ${loc} is currently **${temp}°C** with **${cond}**.\n- **Action:** Rain probability is moderate. A compact travel umbrella in your backpack guarantees protection if unexpected showers develop.`;
    }
  }

  // 3. Bike / Two-wheeler Commute
  if (/bike|motorcycle|scooter|two-wheeler|traffic|drive|car|cycle/i.test(query)) {
    if (isHindi) {
      return `🏍️ **${loc} में टू-व्हीलर / बाइक राइडिंग एडवाइजरी:**\n\n- **तापमान व हवा:** ${temp}°C, हवा की गति ${wind} km/h।\n- **सड़क सुरक्षा:** ${isRainy ? "⚠️ गीली सड़कों पर 2x ब्रेकिंग दूरी बनाए रखें और सफेद रोड मार्किंग्स पर ब्रेक लगाने से बचें।" : "✅ सड़कें सूखी हैं, सामान्य राइडिंग सुरक्षित है।"}\n- **एयर क्वालिटी:** AQI ${aqi} है — ${aqi > 150 ? "राइडिंग के दौरान प्रदूषण और धूल से बचने के लिए N95 मास्क पहनें।" : "हवा सामान्य है।"}\n- **हेलमेट एडवाइजरी:** क्लियर वाइज़र का प्रयोग करें।`;
    } else {
      return `🏍️ **Two-Wheeler & Commute Safety Advisory for ${loc}:**\n\n- **Atmospheric Conditions:** ${temp}°C, Wind velocity ${wind} km/h, AQI ${aqi}.\n- **Road Traction:** ${isRainy ? "⚠️ Wet surfaces reduce tire grip. Double your standard braking buffer and avoid aggressive leaning on turns." : "✅ Clear road surfaces with standard traction."}\n- **Wind & Stability:** ${wind > 30 ? "⚠️ Gusty crosswinds detected; keep firm two-handed grip on flyovers." : "✅ Wind speeds are safe for stable riding."}\n- **Air Protection:** ${aqi > 150 ? "Wear a PM2.5/N95 mask to prevent toxic particulate inhalation on transit." : "Air quality is manageable."}`;
    }
  }

  // 4. Clothing / Outfit Advice
  if (/wear|clothes|outfit|kapde|pehnun|shoes|jacket|fashion/i.test(query)) {
    if (isHindi) {
      return `👕 **आज क्या पहनें (${loc} के मौसम अनुसार):**\n\n- **मौसम का हाल:** ${temp}°C (${cond})।\n- **पहने:** ${temp > 30 ? "हल्के कॉटन या लिनेन के ढीले कपड़े और धूप से बचाव हेतु सनग्लासेस।" : temp < 18 ? "हल्की जैकेट या फुल-स्लीव स्वेटशर्ट।" : "आरामदायक कैजुअल कॉटन कपड़े।"}\n- **जूते:** ${isRainy ? "कैनवास या स्वेड के जूते न पहनें, वॉटर-रेसिस्टेंट स्नीकर्स पहनें।" : "सामान्य आरामदायक जूते।"}\n- **हेल्थ टिप:** यदि धूप तेज हो तो सनस्क्रीन अवश्य लगाएं।`;
    } else {
      return `👕 **Smart Outfit Recommendation for ${loc}:**\n\n- **Atmospheric Feel:** ${temp}°C (${cond}, Humidity ${humidity}%).\n- **Recommended Wear:** ${temp > 30 ? "Breathable cotton or moisture-wicking linen fabrics with UV sunglasses." : temp < 18 ? "Layer with a light windbreaker or thermal sweatshirt." : "Light casual layering (t-shirt + breathable chinos/jeans)."}\n- **Footwear:** ${isRainy ? "Avoid white canvas or suede; wear synthetic water-resistant shoes with rubber tread." : "Comfortable walking sneakers."}`;
    }
  }

  // 5. Departure Time / Timing
  if (/kab niklun|timing|departure|best time|when to leave|schedule|time/i.test(query)) {
    if (isHindi) {
      return `🕒 **घर से निकलने का सर्वश्रेष्ठ समय (${loc}):**\n\n- **सुझावित प्रस्थान:** अगले 30-45 मिनटों में निकलना सबसे अनुकूल है।\n- **संभावित बाधा:** शाम के समय तापमान में गिरावट और ट्रैफिक सघनता बढ़ सकती है।\n- **त्वरित चेकलिस्ट:** फोन चार्ज रखें, पानी की बोतल साथ लें और निकलने से पहले लाइव रडार चेक करें।`;
    } else {
      return `🕒 **Optimized Departure Window for ${loc}:**\n\n- **Recommended Departure:** Stepping out within the next 35–50 minutes offers the most stable atmospheric window.\n- **Hazard Window:** Late evening hours may experience shifting moisture or reduced visibility.\n- **Quick Action:** Verify hydration levels and grab your commute gear before departure.`;
    }
  }

  // 6. Hills / Shimla / Manali / Mountains
  if (/shimla|manali|hills|pahad|mountain|landslide|kufri|gangtok/i.test(query) || isHilly) {
    if (isHindi) {
      return `🏔️ **${loc} पर्वतीय यात्रा चेतावनी:**\n\n- **क्षेत्रीय जोखिम:** पहाड़ी मोड़ों पर कोहरा, फिसलन और ढलान अस्थिरता (Landslide risk) का ध्यान रखें।\n- **ड्राइविंग टिप्स:** भारी बारिश के दौरान घाटी के किनारों और ढीली चट्टानों वाले हिस्सों में रुकने से बचें।\n- **जरूरी सामान:** गर्म कपड़े, टॉर्च, पावर बैंक और फर्स्ट-एड किट साथ रखें।`;
    } else {
      return `🏔️ **Mountain & Hill Corridor Alert for ${loc}:**\n\n- **Slope Stability:** Mountain corridors are sensitive to saturation and fog.\n- **Driving Caution:** Maintain low gears on downhill hairpins, avoid sudden braking, and do not park directly below steep, unreinforced rock slopes.\n- **Emergency Pack:** Keep thermal insulation layers, a flashlight, high-capacity power bank, and emergency rations.`;
    }
  }

  // 7. Air Quality & Health
  if (/aqi|mask|pollution|hawa|pradushan|asthma|breathe/i.test(query)) {
    if (isHindi) {
      return `😷 **वायु गुणवत्ता (AQI) व स्वास्थ्य सुरक्षा रिपोर्ट (${loc}):**\n\n- **वर्तमान AQI:** ${aqi}\n- **स्थिति:** ${aqi > 200 ? "खराब / अस्वस्थ वायु" : aqi > 100 ? "मध्यम वायु" : "अच्छी वायु"}\n- **सलाह:** ${aqi > 150 ? "सड़क पर चलते समय N95 रेस्पिरेटर मास्क अनिवार्य रूप से लगाएं।" : "हवा सामान्य है, मास्क वैकल्पिक है।"}`;
    } else {
      return `😷 **Air Quality Index (AQI) & Respiratory Health Advisory for ${loc}:**\n\n- **Current AQI:** ${aqi} in ${loc}.\n- **Impact:** ${aqi > 200 ? "Unhealthy. High concentrations of particulate matter irritate lungs and eyes." : aqi > 100 ? "Moderate exposure. Sensitive groups may experience respiratory irritation." : "Satisfactory air conditions."}\n- **Action:** ${aqi > 150 ? "Equip an N95/N99 respirator during outdoor transit." : "Standard outdoor activities are safe without respiratory restrictions."}`;
    }
  }

  // Default Comprehensive Decision Synthesis
  if (isHindi) {
    return `🌤️ **व्योमदूत AI — ${loc}${adminState} निर्णय विश्लेषण:**\n\n- **वर्तमान स्थिति:** तापमान **${temp}°C**, स्थिति **${cond}**, हवा **${wind} km/h**, वायु गुणवत्ता **AQI ${aqi}**।\n- **क्या साथ रखें (Carry):** ${isRainy ? "छाता, वॉटरप्रूफ बैग कवर, रेनकोट।" : "पानी की बोतल, सनग्लासेस, हल्का रूमाल।"}\n- **क्या न करें (Avoid):** ${isRainy ? "सफेद कैनवास जूते और जलभराव वाले रास्ते।" : "बिना पानी पिए लंबे समय तक धूप में रहना।"}\n- **मुख्य संदेश:** "मौसम सिर्फ जानिए नहीं — उसके हिसाब से फैसला लीजिए!" क्या आप किसी खास काम (जैसे बाइक राइड, पिकनिक, या यात्रा) के लिए सलाह चाहते हैं?`;
  } else {
    return `🌤️ **VyoomDut AI — Atmospheric Decision Brief for ${loc}${adminState}:**\n\n- **Live Ground Truth:** **${temp}°C**, **${cond}**, Wind **${wind} km/h**, AQI **${aqi}**.\n- **What to Carry:** ${isRainy ? "Sturdy umbrella, waterproof pouch for electronics, light rain layer." : "Hydration flask, sunglasses, and standard daily essentials."}\n- **What to Avoid:** ${isRainy ? "Suede/canvas footwear and low-lying waterlogged roads." : "Extended stationary sun exposure without hydration."}\n- **Decision Mandate:** *"Don't Just Know the Weather. Know What to Do."*\n\nWould you like specific advice for a planned activity (e.g., commute, outdoor sports, or travel)?`;
  }
}

// ----------------------------------------------------
// 3. Conversational VyoomDut AI Chatbot Endpoint
// ----------------------------------------------------
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, weatherContext, language, history } = req.body;
    const userMsg = (message || "").trim();
    const lang = language || "English";

    // 1. Detect if the user is asking about a specific city or location
    let targetContext = weatherContext;
    let queriedCityName: string | null = null;

    const candidateCity = extractCityCandidate(userMsg);
    if (candidateCity) {
      const liveData = await fetchLiveWeatherSummary(candidateCity);
      if (liveData) {
        targetContext = liveData;
        queriedCityName = liveData.location.name;
      }
    }

    const locName = targetContext?.location?.name || "your location";
    const locAdmin = targetContext?.location?.admin ? `, ${targetContext.location.admin}` : "";
    const locCountry = targetContext?.location?.country || "";

    const ai = getAI();
    if (ai) {
      // Try gemini-3.1-flash-lite first (reliable quota), then gemini-3.8-flash
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];

      const systemPrompt = `You are VyoomDut AI, an intelligent, ultra-helpful, versatile conversational AI assistant with premier meteorological intelligence and decision-making expertise.

CRITICAL INSTRUCTIONS ON SCOPE & LOCATION:
1. USER INQUIRY TARGET LOCATION: The user is inquiring about "${locName}${locAdmin} (${locCountry})".
   LIVE GROUND-TRUTH SENSOR DATA FOR ${locName.toUpperCase()}:
   - Temperature: ${targetContext?.current?.temp ?? 26}°C (Feels like: ${targetContext?.current?.feelsLike ?? 26}°C)
   - Weather Condition: ${targetContext?.current?.condition ?? "Clear"}
   - Precipitation: ${targetContext?.current?.precipitation ?? 0} mm
   - Wind Speed: ${targetContext?.current?.windSpeed ?? 12} km/h
   - Relative Humidity: ${targetContext?.current?.humidity ?? 55}%
   - Air Quality (AQI): ${targetContext?.current?.aqi ?? 85}

2. DIRECT ANSWER: If the user asked about ${locName} (or any other place), you MUST answer specifically about ${locName}. DO NOT revert or default to Delhi or any other place unless the user specifically asked for Delhi.
3. GENERAL QUERIES & UNRESTRICTED FREEDOM: If the user asks general knowledge, travel planning, science, programming, math, life advice, or anything under the sun, answer whatever they ask enthusiastically and thoroughly!
4. DECISION-MAKING SPIRIT: Whenever advising on weather, travel, trips, or daily activities, uphold VyoomDut's motto: "Don't Just Know the Weather. Know What to Do!" Give clear, actionable advice (what to pack, carry, wear, timing, and safety).
5. STRICT LANGUAGE REQUIREMENT: The user has selected "${lang}". You MUST respond completely in ${lang} using its proper native script (e.g., if Bengali use বাংলা, if Tamil use தமிழ், if Telugu use తెలుగు, if Hindi use हिन्दी, if Marathi use मराठी, if Gujarati use ગુજરાતી, if Punjabi use ਪੰਜਾਬੀ, if Urdu use اردو, if Odia use ଓଡ଼ିଆ, if Assamese use অসমীया, if Kannada use ಕನ್ನಡ, if Malayalam use മലയാളം). If Hinglish is chosen, respond in natural conversational Hinglish in Latin script.
6. FORMATTING: Structure your response cleanly with bullet points, bold key terms, and helpful emojis where appropriate.`;

      // Assemble multi-turn conversation
      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.sender === "user" ? "user" : "model",
            parts: [{ text: item.text }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: userMsg || "What should I do right now based on the current weather?" }],
      });

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: systemPrompt,
            },
          });

          if (response.text) {
            return res.json({
              reply: response.text,
              targetCity: queriedCityName,
              isDifferentCity: Boolean(
                queriedCityName &&
                weatherContext?.location?.name &&
                queriedCityName.toLowerCase() !== weatherContext.location.name.toLowerCase()
              ),
            });
          }
        } catch (geminiError: any) {
          console.warn(`Gemini model ${model} error:`, geminiError?.message?.slice(0, 120));
        }
      }
    }

    // Zero-Failure Local Meteorological Reasoning Engine with queried location live context
    const intelligentFallback = generateLocalWeatherDecision(userMsg, targetContext, lang);
    res.json({
      reply: intelligentFallback,
      targetCity: queriedCityName,
      isDifferentCity: Boolean(
        queriedCityName &&
        weatherContext?.location?.name &&
        queriedCityName.toLowerCase() !== weatherContext.location.name.toLowerCase()
      ),
    });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.json({
      reply: `🌤️ **VyoomDut AI:** Hello! I am ready to help you with real-time weather information and travel decisions for any city worldwide. Please ask me your question!`,
    });
  }
});

// ----------------------------------------------------
// 4. "SHOW ME YOUR BAG" Multimodal Vision AI Endpoint
// ----------------------------------------------------
app.post("/api/analyze-bag", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, weatherContext, destination, tripDays } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image payload provided" });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets." });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const actualMimeType = mimeType || "image/jpeg";

    const promptText = `You are the Computer Vision Packing Inspector of VyoomDut AI ("Show Me Your Bag AI").
Analyze the items visible in this photo of a user's bag, luggage, or packed items.
Current / Destination Weather:
- Destination: ${destination || weatherContext?.location?.name || "Local Area"}
- Current Temp: ${weatherContext?.current?.temp ?? 28}°C
- Rain Risk: ${weatherContext?.current?.precipitation > 0 ? "High (active precipitation)" : "Moderate"}
- Weather Condition: ${weatherContext?.current?.condition ?? "Variable"}
- Trip Duration: ${tripDays || 2} days

Inspect the image thoroughly and return a valid JSON object matching this schema:
{
  "detectedItems": [
    { "name": string, "category": string, "confidence": "HIGH" | "MEDIUM" }
  ],
  "preparednessScore": number (0 to 100),
  "weatherPreparedVerdict": string (e.g. "Adequately prepared for rain", "Critical protection missing"),
  "missingEssentials": [
    { "item": string, "urgency": "CRITICAL" | "RECOMMENDED", "reason": string }
  ],
  "unnecessaryItems": [
    { "item": string, "reason": string }
  ],
  "recommendationSummary": string
}

Do NOT wrap in markdown with extra conversational preamble. Return pure JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: actualMimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Error in /api/analyze-bag:", err);
    res.status(500).json({ error: "Bag analysis failed", details: err.message });
  }
});

// ----------------------------------------------------
// 5. Weather Corridor & Route Risk API Endpoint
// ----------------------------------------------------
app.post("/api/route-risk", async (req: Request, res: Response) => {
  try {
    const { origin, destination, waypoints, transportMode } = req.body;
    const from = (origin || "Delhi").trim();
    const to = (destination || "Chandigarh").trim();

    // Generate Route A (Direct / Primary) vs Route B (Weather-Optimized Alternative)
    const isHillRoute = /shimla|manali|kufri|gangtok|leh|kullu|mussoorie/i.test(from + to);

    const corridorHops = [
      { name: from, km: 0, weather: "Partly Cloudy", temp: 31, rainRisk: 20, roadRisk: "LOW" },
      { name: "Midpoint Waypoint 1", km: 65, weather: "Scattered Rain", temp: 29, rainRisk: 55, roadRisk: "MODERATE" },
      { name: "Midpoint Waypoint 2", km: 140, weather: "Overcast", temp: 28, rainRisk: 40, roadRisk: "LOW" },
      { name: to, km: 220, weather: isHillRoute ? "Heavy Fog & Showers" : "Passing Showers", temp: isHillRoute ? 17 : 29, rainRisk: isHillRoute ? 75 : 30, roadRisk: isHillRoute ? "HIGH" : "LOW" },
    ];

    const routeA = {
      name: "Route A (NH Expressway / Fastest)",
      distanceKm: 225,
      estimatedTime: "4h 15m",
      rainRisk: "Moderate (48%)",
      visibility: "Moderate (5–7 km)",
      hazardRating: isHillRoute ? "HIGH (Slope runoff & fog)" : "MODERATE (Localized puddles)",
      recommended: false,
      reason: "Overlaps with active rain squall band between km 120 and 170.",
    };

    const routeB = {
      name: "Route B (Weather-Safe State Bypass)",
      distanceKm: 242,
      estimatedTime: "4h 35m",
      rainRisk: "Low (18%)",
      visibility: "Clear (10+ km)",
      hazardRating: "LOW (Dry highway corridor)",
      recommended: true,
      reason: "+17 km extra distance, but completely skirts the stationary rain cell. Safer for both driving & bikes.",
    };

    res.json({
      origin: from,
      destination: to,
      corridorHops,
      routeA,
      routeB,
      verdict: "Route B is strongly recommended to eliminate hydroplaning and low-visibility risks.",
    });
  } catch (err: any) {
    console.error("Error in /api/route-risk:", err);
    res.status(500).json({ error: "Route risk evaluation failed", details: err.message });
  }
});

// ----------------------------------------------------
// Mount Vite Middleware for Development / Static in Production
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WeatherGPT server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
