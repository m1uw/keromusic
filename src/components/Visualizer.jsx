import React, { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';
import { BarChart3, Info } from 'lucide-react';

export default function Visualizer() {
  const { isPlaying, volume, isMuted, currentTrack, eqEnabled, eqGains } = usePlayerStore();
  const { activeTheme, glassmorphism } = useThemeStore();

  const volumeMult = isMuted ? 0 : volume / 100;

  // Map visualizer bars to 7 EQ frequency bands
  const getEqMultiplier = (barIndex) => {
    if (!eqEnabled || !eqGains) return 1;
    let bandKey = '1000';
    if (barIndex <= 5) bandKey = '60';
    else if (barIndex <= 11) bandKey = '150';
    else if (barIndex <= 17) bandKey = '400';
    else if (barIndex <= 23) bandKey = '1000';
    else if (barIndex <= 29) bandKey = '3000';
    else if (barIndex <= 37) bandKey = '8000';
    else bandKey = '15000';

    const db = eqGains[bandKey] || 0;
    // Map -12dB ... +12dB to 0.2 ... 2.0 linear multiplier
    return Math.max(0.2, 1 + db / 12);
  };

  // Generate 45 bars with varying default heights and animation delays
  const bars = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => {
      // Pick one of the 4 css animations
      const animType = (i % 4) + 1;
      const delay = (i * 0.08).toFixed(2);
      // Vary the height coefficients for visual depth
      const heightCoef = 20 + (i % 5) * 15; 
      return { id: i, animType, delay, heightCoef };
    });
  }, []);

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 select-none relative overflow-hidden h-full ${
      glassmorphism ? 'glass-panel-heavy' : 'bg-darkbg'
    }`}>
      {/* Dynamic Background Radial Glow */}
      <div 
        className="w-[450px] h-[450px] rounded-full blur-[120px] opacity-10 absolute pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${activeTheme.accent} 0%, transparent 70%)`,
          transform: isPlaying ? 'scale(1.15)' : 'scale(0.95)'
        }}
      />

      {/* Meta Container */}
      <div className="text-center z-10 space-y-4 mb-10 max-w-md">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 shadow-premium">
          <BarChart3 className="w-8 h-8" style={{ color: activeTheme.accent }} />
        </div>
        
        {currentTrack ? (
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-brightwhite truncate">{currentTrack.title}</h2>
            <p className="text-xs text-lightgray truncate">{currentTrack.artist}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-lightgray">Visualizer Offline</h2>
            <p className="text-xs text-lightgray/40">Select a song to wake up the visual frequencies</p>
          </div>
        )}
      </div>

      {/* Synchronized Neon Equalizer Wave */}
      <div className="w-full max-w-2xl h-44 flex items-end justify-center gap-1.5 z-10 px-4 relative">
        {bars.map((bar) => {
          const mult = getEqMultiplier(bar.id);
          // Adjust vertical height limit based on active volume level and dynamic EQ band gains!
          const maxVolumeHeight = `${bar.heightCoef * volumeMult * mult}%`;

          return (
            <div
              key={bar.id}
              className={`w-[7px] min-h-[4px] rounded-full transition-all duration-300 eq-bar-${bar.animType}`}
              style={{
                backgroundColor: activeTheme.accent,
                boxShadow: isPlaying ? `0 0 10px ${activeTheme.glow}, 0 0 4px ${activeTheme.accent}` : 'none',
                animationDelay: `-${bar.delay}s`,
                animationPlayState: isPlaying && volumeMult > 0 ? 'running' : 'paused',
                height: isPlaying && volumeMult > 0 ? undefined : '5px',
                maxHeight: maxVolumeHeight,
                opacity: volumeMult > 0 ? 0.45 + (bar.id % 3) * 0.2 : 0.15
              }}
            />
          );
        })}
      </div>

      {/* Visualizer Status Footer */}
      <div className="mt-12 text-[10px] text-lightgray/30 flex items-center gap-1.5 z-10">
        <Info className="w-3.5 h-3.5" />
        <span>Hardware accelerated mock spectrum • Consume a menos de 0.2% de CPU</span>
      </div>
    </div>
  );
}
