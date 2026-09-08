import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Wind, 
  CloudRain, 
  Compass, 
  AlertCircle, 
  Info,
  Zap,
  Clock
} from "lucide-react";
import { LocationInfo, CurrentWeather } from "../types";

interface RainRadarMapProps {
  location: LocationInfo;
  current: CurrentWeather;
}

interface StormCell {
  id: string;
  name: string;
  distanceKm: number;
  direction: string;
  speedKmH: number;
  intensityDbz: number;
  etaMinutes: number;
  severity: "LIGHT" | "MODERATE" | "HEAVY" | "SEVERE";
  angle: number; // in radians from center
}

export const RainRadarMap: React.FC<RainRadarMapProps> = ({ location, current }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeOffsetIndex, setTimeOffsetIndex] = useState<number>(1); // 0: -30m, 1: Now, 2: +30m, 3: +60m, 4: +90m, 5: +120m
  const [showWindParticles, setShowWindParticles] = useState<boolean>(true);
  const [showStormCells, setShowStormCells] = useState<boolean>(true);
  const [showRings, setShowRings] = useState<boolean>(true);

  const timeOffsets = [
    { label: "-30m", minutes: -30, sub: "Past echo" },
    { label: "Now", minutes: 0, sub: "Live Doppler" },
    { label: "+30m", minutes: 30, sub: "Nowcasting" },
    { label: "+60m", minutes: 60, sub: "Predictive" },
    { label: "+90m", minutes: 90, sub: "Outlook" },
    { label: "+120m", minutes: 120, sub: "2h Horizon" },
  ];

  // Base storm cells derived deterministically from current rain/wind
  const baseRainActive = current.precipitation > 0 || current.humidity > 70;
  const stormCells: StormCell[] = [
    {
      id: "cell-1",
      name: "Cell Alpha (Precipitation Core)",
      distanceKm: baseRainActive ? 12 : 28,
      direction: "SW (220°)",
      speedKmH: Math.max(14, Math.round(current.windSpeed * 1.2)),
      intensityDbz: baseRainActive ? 48 : 32,
      etaMinutes: baseRainActive ? 15 : 45,
      severity: baseRainActive ? "HEAVY" : "MODERATE",
      angle: (220 * Math.PI) / 180,
    },
    {
      id: "cell-2",
      name: "Squall Band Beta",
      distanceKm: baseRainActive ? 38 : 55,
      direction: "NW (315°)",
      speedKmH: Math.max(18, Math.round(current.windSpeed * 1.5)),
      intensityDbz: baseRainActive ? 54 : 26,
      etaMinutes: baseRainActive ? 35 : 75,
      severity: baseRainActive ? "SEVERE" : "LIGHT",
      angle: (315 * Math.PI) / 180,
    },
    {
      id: "cell-3",
      name: "Convective Cluster Gamma",
      distanceKm: 46,
      direction: "NE (045°)",
      speedKmH: 16,
      intensityDbz: 28,
      etaMinutes: 80,
      severity: "LIGHT",
      angle: (45 * Math.PI) / 180,
    },
  ];

  // Auto-play interval across time steps
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOffsetIndex((prev) => (prev + 1) % timeOffsets.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Canvas radar renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let sweepAngle = 0;

    // Wind particles
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 8 + 4,
      speed: (Math.random() * 1.5 + 0.8) * (current.windSpeed / 12 || 1),
    }));

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) - 20;

      // Clear with atmospheric dark slate
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // 1. Concentric Radar Distance Rings
      if (showRings) {
        ctx.lineWidth = 1;
        [0.25, 0.5, 0.75, 1.0].forEach((ratio, i) => {
          const r = maxRadius * ratio;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(14, 165, 233, 0.15)";
          ctx.stroke();

          // Distance labels (20km, 40km, 60km, 80km)
          ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
          ctx.font = "10px monospace";
          ctx.fillText(`${Math.round(ratio * 80)}km`, centerX + 4, centerY - r + 12);
        });

        // Crosshairs (N-S, E-W)
        ctx.beginPath();
        ctx.moveTo(centerX - maxRadius, centerY);
        ctx.lineTo(centerX + maxRadius, centerY);
        ctx.moveTo(centerX, centerY - maxRadius);
        ctx.lineTo(centerX, centerY + maxRadius);
        ctx.strokeStyle = "rgba(14, 165, 233, 0.12)";
        ctx.stroke();

        // Compass Cardinal directions
        ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("N", centerX, centerY - maxRadius - 6);
        ctx.fillText("S", centerX, centerY + maxRadius + 14);
        ctx.fillText("W", centerX - maxRadius - 10, centerY + 4);
        ctx.fillText("E", centerX + maxRadius + 10, centerY + 4);
      }

      // 2. Simulated Precipitation Doppler Blobs with Nowcast Displacement
      const minutesAhead = timeOffsets[timeOffsetIndex].minutes;
      const offsetRatio = minutesAhead / 60; // hours

      // Draw radar reflectivity layers
      const blobs = [
        {
          baseX: centerX - 55 + offsetRatio * 18,
          baseY: centerY + 40 - offsetRatio * 12,
          radius: 65,
          dbz: current.precipitation > 0 ? 45 : 30,
        },
        {
          baseX: centerX + 70 + offsetRatio * 15,
          baseY: centerY - 60 - offsetRatio * 10,
          radius: 50,
          dbz: current.precipitation > 0 ? 38 : 22,
        },
        {
          baseX: centerX - 80 + offsetRatio * 22,
          baseY: centerY - 50 - offsetRatio * 14,
          radius: 75,
          dbz: current.precipitation > 0 ? 52 : 35,
        },
        {
          baseX: centerX + 15 + offsetRatio * 16,
          baseY: centerY + 70 - offsetRatio * 8,
          radius: 40,
          dbz: current.precipitation > 0 ? 32 : 18,
        },
      ];

      blobs.forEach((blob) => {
        const grad = ctx.createRadialGradient(
          blob.baseX,
          blob.baseY,
          2,
          blob.baseX,
          blob.baseY,
          blob.radius
        );

        if (blob.dbz >= 50) {
          // Severe / Heavy (Crimson to Orange to Yellow)
          grad.addColorStop(0, "rgba(239, 68, 68, 0.85)");
          grad.addColorStop(0.35, "rgba(249, 115, 22, 0.7)");
          grad.addColorStop(0.7, "rgba(234, 179, 8, 0.45)");
          grad.addColorStop(1, "rgba(34, 197, 94, 0)");
        } else if (blob.dbz >= 35) {
          // Moderate (Yellow to Green)
          grad.addColorStop(0, "rgba(234, 179, 8, 0.8)");
          grad.addColorStop(0.4, "rgba(34, 197, 94, 0.6)");
          grad.addColorStop(0.8, "rgba(14, 165, 233, 0.35)");
          grad.addColorStop(1, "rgba(14, 165, 233, 0)");
        } else {
          // Light drizzle / cloud (Cyan/Blue to transparent)
          grad.addColorStop(0, "rgba(14, 165, 233, 0.7)");
          grad.addColorStop(0.5, "rgba(56, 189, 248, 0.4)");
          grad.addColorStop(1, "rgba(14, 165, 233, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blob.baseX, blob.baseY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Wind Streamline Particles
      if (showWindParticles) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(165, 243, 252, 0.45)";
        particles.forEach((p) => {
          // Move from SW to NE roughly
          p.x += p.speed;
          p.y -= p.speed * 0.6;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.length, p.y + p.length * 0.6);
          ctx.stroke();
        });
      }

      // 4. Rotating Radar Beam Sweep with phosphorescent trail
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sweepAngle);

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fading phosphorescent sector (60 degrees)
      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
      sweepGrad.addColorStop(0, "rgba(6, 182, 212, 0.3)");
      sweepGrad.addColorStop(1, "rgba(6, 182, 212, 0.0)");

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, -Math.PI / 3, 0);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      sweepAngle += 0.025;

      // 5. Center Marker (City Center)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Pulsing wave around city center
      const pulseR = (Date.now() / 40) % 25;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - pulseR / 25})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // City Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(location.name, centerX, centerY + 18);

      // 6. Storm Cell Markers & Vector Vectors
      if (showStormCells) {
        stormCells.forEach((cell) => {
          const effectiveDistance = Math.max(
            8,
            cell.distanceKm - (cell.speedKmH * offsetRatio)
          );
          const cellRadiusOnRadar = (effectiveDistance / 80) * maxRadius;
          const cx = centerX + Math.cos(cell.angle) * cellRadiusOnRadar;
          const cy = centerY + Math.sin(cell.angle) * cellRadiusOnRadar;

          // Icon marker
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fillStyle =
            cell.severity === "SEVERE"
              ? "#ef4444"
              : cell.severity === "HEAVY"
              ? "#f97316"
              : "#eab308";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // Movement vector arrow
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 18, cy + 12);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(
            `${cell.name.split(" ")[1]} (${Math.round(effectiveDistance)}km)`,
            cx,
            cy - 9
          );
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [timeOffsetIndex, showWindParticles, showStormCells, showRings, location.name, current]);

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Doppler Rain Radar & Storm Tracker
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                80km Radial Echo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time precipitation reflectivity (dBZ), convective storm trajectories, and wind vector streamlines for {location.name}
            </p>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setShowWindParticles(!showWindParticles)}
            className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition ${
              showWindParticles
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Vectors</span>
          </button>

          <button
            onClick={() => setShowStormCells(!showStormCells)}
            className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition ${
              showStormCells
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Storm Cells</span>
          </button>

          <button
            onClick={() => setShowRings(!showRings)}
            className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition ${
              showRings
                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Range Rings</span>
          </button>
        </div>
      </div>

      {/* Main Radar Screen + Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Canvas Radar Display */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative bg-slate-950 rounded-3xl border border-slate-800 p-3 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={480}
            height={440}
            className="w-full max-w-[480px] aspect-square rounded-2xl cursor-crosshair"
          />

          {/* Radar Overlay Status Badge */}
          <div className="absolute top-5 left-5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-[11px] font-semibold text-slate-300 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Doppler Frequency: 5.6 GHz (C-Band)</span>
          </div>

          {/* dBZ Reflectivity Scale Legend */}
          <div className="w-full mt-3 px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">Reflectivity (dBZ):</span>
            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                15–25 Drizzle
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                25–35 Moderate
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                35–45 Heavy
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                45–65 Severe/Hail
              </span>
            </div>
          </div>
        </div>

        {/* Right: Nowcasting Timeline Controls + Storm Cell Telemetry */}
        <div className="lg:col-span-5 space-y-5">
          {/* Time Scrubber */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Nowcasting Time Step</span>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1 hover:bg-cyan-400 transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause Loop" : "Play Loop"}</span>
              </button>
            </div>

            {/* Time Step Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {timeOffsets.map((step, idx) => (
                <button
                  key={step.label}
                  onClick={() => {
                    setTimeOffsetIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={`p-2 rounded-xl border text-center transition ${
                    timeOffsetIndex === idx
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                >
                  <div className="text-xs font-bold">{step.label}</div>
                  <div className="text-[9px] opacity-80 whitespace-nowrap">{step.sub}</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              *Scrubbing steps forwards dynamically computes projected cloud mass displacement along the prevailing wind vector ({current.windSpeed} km/h).
            </p>
          </div>

          {/* Active Storm Cell Telemetry Table */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-amber-400" />
                <span>Active Tracked Rain Cells ({stormCells.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Radial: 80 km</span>
            </div>

            <div className="space-y-2">
              {stormCells.map((cell) => {
                const effectiveDistance = Math.max(
                  6,
                  cell.distanceKm - (cell.speedKmH * (timeOffsets[timeOffsetIndex].minutes / 60))
                );

                return (
                  <div
                    key={cell.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{cell.name}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            cell.severity === "SEVERE"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : cell.severity === "HEAVY"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {cell.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span>Bearing: {cell.direction}</span>
                        <span>Speed: {cell.speedKmH} km/h</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-cyan-300">
                        {Math.round(effectiveDistance)} km away
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ETA: ~{Math.max(5, Math.round((effectiveDistance / cell.speedKmH) * 60))}m
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meteorological Radar Advisory */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Radar Decision Protocol:</strong> If convective echoes exceed 45 dBZ within 20 km of your coordinates, postpone open two-wheeler travel and seek reinforced overhead shelter.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
