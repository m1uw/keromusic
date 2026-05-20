import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';
import { youtubeService } from '../services/youtubeService';
import { Music, EyeOff } from 'lucide-react';

export default function LyricsPanel() {
  const { currentTrack, progress, isPlaying } = usePlayerStore();
  const { activeTheme, glassmorphism, isLightMode } = useThemeStore();
  const [lyrics, setLyrics] = useState([]);
  const containerRef = useRef(null);

  // Fetch or generate lyrics when the track changes
  useEffect(() => {
    let active = true;
    if (currentTrack) {
      youtubeService.getLyrics(currentTrack.title, currentTrack.artist).then((generated) => {
        if (active) setLyrics(generated);
      });
    } else {
      setLyrics([]);
    }
    return () => { active = false; };
  }, [currentTrack]);

  // Compute the current active lyric line index based on elapsed player progress
  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    
    // Find the latest line that has a timestamp <= current progress
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        return i;
      }
    }
    return 0;
  }, [lyrics, progress]);

  // Automatically scroll the active lyric line to the center of the viewport
  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeElement = containerRef.current.querySelector(`[data-lyric-idx="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeIndex]);

  const bgStyleClass = isLightMode
    ? (glassmorphism ? 'bg-white/85 backdrop-blur-md text-black' : 'bg-[#f4f4f7] text-[#121212]')
    : (glassmorphism ? 'glass-panel-heavy' : 'bg-darkbg text-brightwhite');

  const textPrimaryClass = isLightMode ? 'text-black' : 'text-brightwhite';
  const textSecondaryClass = isLightMode ? 'text-gray-500' : 'text-lightgray/60';
  const borderDividerClass = isLightMode ? 'border-gray-200' : 'border-white/5';

  return (
    <div className={`flex-1 flex flex-col p-8 select-none relative overflow-hidden h-full transition-colors duration-500 ${bgStyleClass}`}>
      
      {/* Background Radial Glow */}
      <div 
        className="w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.05] absolute -right-20 -top-20 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${activeTheme.accent} 0%, transparent 75%)`,
          transform: isPlaying ? 'scale(1.1)' : 'scale(0.9)'
        }}
      />

      {/* Header Info */}
      <div className={`flex items-center gap-3 border-b pb-4 mb-6 z-10 shrink-0 ${borderDividerClass}`}>
        <Music className="w-5 h-5" style={{ color: activeTheme.accent }} />
        <div>
          <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Letras Sincronizadas</h3>
          <span className={`text-[10px] ${textSecondaryClass}`}>Motor premium de desplazamiento de líricas</span>
        </div>
      </div>

      {/* Lyrics Scrolling Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col justify-start gap-8 py-20 z-10 scroll-smooth"
      >
        {currentTrack ? (
          lyrics.length > 0 ? (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              
              // Light/Dark specific line styles
              const activeLineClass = isLightMode 
                ? 'text-black text-xl md:text-2xl font-extrabold scale-105 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                : 'text-brightwhite text-xl md:text-2xl font-extrabold scale-105 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]';

              const inactiveLineClass = isLightMode
                ? 'text-black/30 hover:text-black/60 text-base md:text-lg font-semibold'
                : 'text-lightgray/40 hover:text-brightwhite/70 text-base md:text-lg font-medium';

              return (
                <div
                  key={idx}
                  data-lyric-idx={idx}
                  className={`text-center transition-all duration-500 cursor-pointer ${
                    isActive ? activeLineClass : inactiveLineClass
                  }`}
                  style={isActive ? { color: activeTheme.accent } : {}}
                >
                  {line.text}
                </div>
              );
            })
          ) : (
            <div className={`flex flex-col items-center justify-center h-full gap-3 opacity-40`}>
              <EyeOff className="w-8 h-8" />
              <span className="text-xs">No se encontraron letras para esta canción.</span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Music className="w-8 h-8" />
            <span className="text-xs">Selecciona un tema para ver sus letras sincronizadas</span>
          </div>
        )}
      </div>
    </div>
  );
}
