import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Tv, X, Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';
import { youtubeService } from '../services/youtubeService';

export default function ChromecastOverlay({ onClose }) {
  const { currentTrack, progress, duration, isPlaying, togglePlay, next, prev, seek } = usePlayerStore();
  const { activeTheme } = useThemeStore();
  const [lyrics, setLyrics] = useState([]);
  const containerRef = useRef(null);

  // Fetch lyrics dynamically
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

  // Active lyric index based on player progress
  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        return i;
      }
    }
    return 0;
  }, [lyrics, progress]);

  // Scroll active lyric to center
  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeElement = containerRef.current.querySelector(`[data-cast-lyric-idx="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeIndex]);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const timeRemaining = useMemo(() => {
    if (!duration || isNaN(progress)) return '';
    const diff = duration - progress;
    return `-${formatTime(diff)}`;
  }, [progress, duration]);

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 bg-[#09090b]/98 z-[9999] flex flex-col md:flex-row select-none animate-fade-in text-white overflow-hidden p-6 md:p-12">
      {/* Dynamic ambient blur background reactively glowing based on theme */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[200px] opacity-[0.08] pointer-events-none transition-all duration-1000 -left-40 -top-40"
        style={{
          background: `radial-gradient(circle, ${activeTheme.accent} 0%, transparent 75%)`,
        }}
      />

      {/* Floating Cast Info / Stop casting bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-auto z-[10000]">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md">
          <Tv className="w-5 h-5 text-green-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wide">Transmitiendo en Chromecast Salón</span>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-full transition-all duration-300"
          title="Detener transmisión"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Left side: Media Information & Controls */}
      <div className="w-full md:w-[45%] flex flex-col justify-center items-center md:items-start text-center md:text-left pr-0 md:pr-12 border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0 relative z-10">
        <div className="relative group max-w-[320px] aspect-square w-full rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 mb-8">
          <img 
            src={currentTrack.thumbnail} 
            alt={currentTrack.title}
            className="w-full h-full object-cover transition-transform duration-700"
          />
          {/* Reactive dynamic glow overlay */}
          <div 
            className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none blur-xl"
            style={{
              boxShadow: `0 0 100px 30px ${activeTheme.accent}`
            }}
          />
        </div>

        <div className="w-full max-w-[380px] space-y-2">
          {/* Scrollable title/artist */}
          <div className="overflow-hidden w-full relative">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight whitespace-nowrap animate-marquee">
              {currentTrack.title}
            </h1>
          </div>
          <p className="text-sm md:text-base opacity-60 font-medium">{currentTrack.artist}</p>
        </div>

        {/* Timeline progress line */}
        <div className="w-full max-w-[380px] mt-8 space-y-2">
          <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${duration ? (progress / duration) * 100 : 0}%`,
                backgroundColor: activeTheme.accent 
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-bold opacity-60">
            <span>{formatTime(progress)}</span>
            <span>{timeRemaining}</span>
          </div>
        </div>

        {/* TV control shortcuts */}
        <div className="flex items-center justify-center md:justify-start gap-6 mt-8">
          <button 
            onClick={prev}
            className="p-3.5 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-95 border border-white/5"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={togglePlay}
            className="p-4 bg-white hover:bg-gray-100 rounded-full transition-all active:scale-90 text-black shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>
          <button 
            onClick={next}
            className="p-3.5 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-95 border border-white/5"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Right side: Synced lyrics panel tailored for TV screen sizes */}
      <div className="w-full md:w-[55%] flex flex-col pl-0 md:pl-12 justify-center h-full relative z-10 pt-8 md:pt-0">
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col justify-start gap-12 py-32 scroll-smooth text-center md:text-left"
        >
          {lyrics.length > 0 ? (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              return (
                <p
                  key={idx}
                  data-cast-lyric-idx={idx}
                  className={`transition-all duration-500 origin-left ${
                    isActive 
                      ? 'text-3xl md:text-4xl font-extrabold scale-105 opacity-100 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]' 
                      : 'text-lg md:text-xl font-bold opacity-20 hover:opacity-40'
                  }`}
                  style={isActive ? { color: activeTheme.accent } : {}}
                >
                  {line.text}
                </p>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 h-full opacity-40">
              <Tv className="w-12 h-12 stroke-[1.5]" />
              <p className="text-base font-bold italic">Letras no sincronizadas para este tema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
