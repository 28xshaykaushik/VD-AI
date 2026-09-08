import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showTagline = true,
  className = "",
}) => {
  const iconSizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const titleSizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Visual Logo Mark */}
      <div
        className={`relative ${iconSizeClasses[size]} rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/25 shrink-0 group`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Animated Atmospheric Rings */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.3)_0%,transparent_70%)] animate-pulse" />
          
          {/* Stylized Vortex & Sun-Droplet SVG Icon */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-500"
          >
            {/* Outer Isobaric Swirl */}
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray="40 16"
              className="opacity-70 animate-[spin_12s_linear_infinite]"
            />
            {/* Inner Atmospheric Wave */}
            <path
              d="M10 18C11.5 15.5 13.5 15.5 15 17C16.5 18.5 18.5 18.5 20 16C21.5 13.5 22.5 15 23 16"
              stroke="url(#mv-grad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Sun Core / Weather Nexus */}
            <circle cx="16" cy="11" r="3.2" fill="#38bdf8" />
            <circle cx="16" cy="11" r="5" stroke="#38bdf8" strokeWidth="0.75" strokeOpacity="0.5" />
            
            {/* Raindrop Accents */}
            <path
              d="M13 22L12 24M19 22L18 24"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient id="mv-grad" x1="10" y1="17" x2="23" y2="17" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${titleSizeClasses[size]} font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent`}
          >
            VyoomDut
          </span>
          <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
            AI
          </span>
        </div>
        {showTagline && (
          <p className="text-[11px] font-medium text-slate-400 leading-none mt-0.5 tracking-tight hidden sm:block">
            Intelligent Atmospheric Decision Engine
          </p>
        )}
      </div>
    </div>
  );
};
