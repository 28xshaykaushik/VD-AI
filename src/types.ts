export interface LocationInfo {
  name: string;
  country: string;
  admin?: string;
  lat: number;
  lon: number;
  isMountainous?: boolean;
  timezone?: string;
  localTime?: string;
  localDate?: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  uvIndex: number;
  precipitation: number;
  weatherCode: number;
  condition: string;
  hazard: string;
  aqi: number;
  pm25: number;
  pm10: number;
  isDay: boolean;
  localTime?: string;
}

export interface HourlyForecast {
  time: string;
  displayTime?: string;
  dateStr?: string;
  rawIso: string;
  temp: number;
  pop: number; // probability of precipitation (0-100)
  precipMm: number;
  windSpeed: number;
  weatherCode: number;
  info: {
    label: string;
    icon: string;
    hazard: string;
  };
  riskTag: "SAFE" | "MODERATE" | "HIGH";
  isCurrent?: boolean;
}

export interface DailyForecast {
  day: string;
  date: string;
  maxTemp: number;
  minTemp: number;
  pop: number;
  precipSum: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
  info: {
    label: string;
    icon: string;
    hazard: string;
  };
}

export interface WeatherDNA {
  cold: number; // 0-10
  rain: number; // 0-10
  wind: number; // 0-10
  visibility: number; // 0-10
  outdoorComfort: number; // 0-10
  travelReliability: number; // 0-10
}

export interface DisasterRisk {
  alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  alertTitle: string;
  alertSummary: string;
  isMountainous: boolean;
  scores: {
    slopeLandslide: number;
    urbanWaterlogging: number;
    heatStress: number;
    windGustHazard: number;
  };
}

export interface ModelEnsemble {
  consensus: "HIGH" | "MEDIUM" | "LOW";
  varianceSpread: string;
  analysis: string;
  models: Array<{
    name: string;
    rainProbability: number;
    tempOffset: number;
  }>;
}

export interface SurpriseAlert {
  hasSurprise: boolean;
  title: string;
  description: string;
  actionPrompt: string;
}

export interface HomeAction {
  id: string;
  icon: string;
  label: string;
  urgent: boolean;
}

export interface WeatherData {
  location: LocationInfo;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  dna: WeatherDNA;
  disasterRisk: DisasterRisk;
  modelEnsemble: ModelEnsemble;
  surpriseAlert: SurpriseAlert;
  homeActions: HomeAction[];
}

export interface MissionResult {
  feasibilityScore: number;
  statusTag: string;
  verdictSummary: string;
  carry: Array<{ item: string; reason: string }>;
  dontCarry: Array<{ item: string; reason: string }>;
  bestTime: {
    recommendedDeparture: string;
    hazardWindow: string;
    explanation: string;
  };
  plans: {
    planA: { name: string; score: number; description: string };
    planB: { name: string; score: number; description: string };
    planC: { name: string; score: number; description: string };
  };
  outfitAdvice: {
    wear: string[];
    avoid: string[];
    transportTip: string;
  };
}

export interface RouteCorridorHop {
  name: string;
  km: number;
  weather: string;
  temp: number;
  rainRisk: number;
  roadRisk: string;
}

export interface RouteOption {
  name: string;
  distanceKm: number;
  estimatedTime: string;
  rainRisk: string;
  visibility: string;
  hazardRating: string;
  recommended: boolean;
  reason: string;
}

export interface RouteRiskResult {
  origin: string;
  destination: string;
  corridorHops: RouteCorridorHop[];
  routeA: RouteOption;
  routeB: RouteOption;
  verdict: string;
}

export interface BagAnalysisResult {
  detectedItems: Array<{ name: string; category: string; confidence: "HIGH" | "MEDIUM" }>;
  preparednessScore: number;
  weatherPreparedVerdict: string;
  missingEssentials: Array<{ item: string; urgency: "CRITICAL" | "RECOMMENDED"; reason: string }>;
  unnecessaryItems: Array<{ item: string; reason: string }>;
  recommendationSummary: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface EventSimulationConfig {
  eventType: "wedding" | "sports" | "cocktail" | "poolside" | "concert" | "picnic";
  venueType: "open_lawn" | "german_hanger" | "terrace" | "poolside" | "courtyard";
  targetDate: string;
  timeSlot: "morning" | "afternoon" | "evening" | "night";
  guestCount: number;
}

export interface EventRiskVector {
  id: string;
  name: string;
  score: number; // 0-100 (higher = safer)
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  metricDisplay: string;
  advice: string;
  mitigation: string;
}

export interface AlternativeDateSlot {
  date: string;
  dayLabel: string;
  isWeekend: boolean;
  score: number;
  condition: string;
  temp: number;
  rainPop: number;
  windSpeed: number;
  verdict: "OPTIMAL" | "FEASIBLE" | "RISKY";
  highlight?: string;
}
