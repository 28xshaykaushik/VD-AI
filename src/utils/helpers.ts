export function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" };
  return { label: "Hazardous", color: "text-rose-500", bg: "bg-rose-500/20 border-rose-500/40" };
}

export function getUvCategory(uv: number) {
  if (uv <= 2) return { label: "Low", advice: "No protection required." };
  if (uv <= 5) return { label: "Moderate", advice: "Wear sunscreen & sunglasses during midday." };
  if (uv <= 7) return { label: "High", advice: "Hat + SPF 30+ recommended; seek shade." };
  if (uv <= 10) return { label: "Very High", advice: "Extra protection needed. Avoid peak sun." };
  return { label: "Extreme", advice: "Take full precautions; skin burns rapidly." };
}

export function getAlertBadge(level: "GREEN" | "YELLOW" | "ORANGE" | "RED") {
  switch (level) {
    case "RED":
      return { bg: "bg-red-500/20 text-red-400 border-red-500/40", dot: "bg-red-500" };
    case "ORANGE":
      return { bg: "bg-amber-500/20 text-amber-400 border-amber-500/40", dot: "bg-amber-500" };
    case "YELLOW":
      return { bg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", dot: "bg-yellow-400" };
    default:
      return { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", dot: "bg-emerald-500" };
  }
}
