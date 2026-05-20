import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize, Tv } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';

export default function CompactPlayer() {
  const { currentTrack, isPlaying, progress, duration, togglePlay, next, prev, seek, setCompactMode } = usePlayerStore();
  const { activeTheme } = useThemeStore();

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimelineChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 relative overflow-hidden bg-darkbg select-none">
      
      {/* Blurred Background Art */}
      {currentTrack && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 transition-all duration-1000 scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
        />
      )}

      {/* Title Bar drag space (only in compact mode) */}
      <div className="w-full flex items-center justify-between z-10 shrink-0 titlebar-drag">
        <span className="text-[10px] font-bold text-lightgray uppercase tracking-widest">Kero Player</span>
        <button
          onClick={() => setCompactMode(false)}
          title="Exit Compact Mode"
          className="p-1 rounded bg-white/5 hover:bg-white/10 text-lightgray hover:text-brightwhite transition-all titlebar-nodrag"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rotating Center Disc Cover Art */}
      <div className="flex-1 flex items-center justify-center z-10 my-4">
        {currentTrack ? (
          <div className="relative group">
            {/* Ambient Shadow Glow */}
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-500 scale-105"
              style={{
                background: `radial-gradient(circle, ${activeTheme.accent} 0%, transparent 70%)`,
              }}
            />
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className={`w-40 h-40 rounded-full object-cover border-4 border-panelbg shadow-premium ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ 
                animationDuration: '20s',
                boxShadow: `0 0 25px ${activeTheme.glow}`
              }}
            />
            {/* Record Center Hole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-panelbg border border-white/5 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-darkbg" />
            </div>
          </div>
        ) : (
          <div className="w-36 h-36 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-lightgray text-xs font-semibold">
            Ready to play
          </div>
        )}
      </div>

      {/* Song Metadata */}
      <div className="w-full text-center z-10 mb-4 shrink-0 px-4">
        {currentTrack ? (
          <div className="flex flex-col max-w-full overflow-hidden">
            <span className="text-sm font-extrabold text-brightwhite truncate">{currentTrack.title}</span>
            <span className="text-xs text-lightgray truncate">{currentTrack.artist}</span>
          </div>
        ) : (
          <span className="text-xs text-lightgray/50">Select a song to start streaming</span>
        )}
      </div>

      {/* Controls & Mini Progress timeline */}
      <div className="w-full flex flex-col items-center gap-3 z-10 shrink-0">
        
        {/* Timeline Slider */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[9px] text-lightgray/60 tabular-nums w-8 text-right">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={handleTimelineChange}
            disabled={!currentTrack}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, ${activeTheme.accent} 0%, ${activeTheme.accent} ${
                duration ? (progress / duration) * 100 : 0
              }%, rgba(255,255,255,0.1) ${
                duration ? (progress / duration) * 100 : 0
              }%, rgba(255,255,255,0.1) 100%)`
            }}
          />
          <span className="text-[9px] text-lightgray/60 tabular-nums w-8 text-left">
            {formatTime(duration)}
          </span>
        </div>

        {/* Media Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={prev}
            disabled={!currentTrack}
            className="p-1 rounded text-lightgray hover:text-brightwhite active:scale-90 transition-all disabled:opacity-30"
          >
            <SkipBack className="w-4.5 h-4.5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-glow"
            style={{ 
              backgroundColor: activeTheme.accent,
              boxShadow: `0 0 15px ${activeTheme.glow}`
            }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black text-black" />
            ) : (
              <Play className="w-5 h-5 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            disabled={!currentTrack}
            className="p-1 rounded text-lightgray hover:text-brightwhite active:scale-90 transition-all disabled:opacity-30"
          >
            <SkipForward className="w-4.5 h-4.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
