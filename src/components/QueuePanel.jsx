import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';
import { Trash2, Disc, Play, ArrowDownWideNarrow } from 'lucide-react';

export default function QueuePanel() {
  const { queue, currentTrack, isPlaying, playTrack, removeFromQueue, clearQueue } = usePlayerStore();
  const { activeTheme, glassmorphism, isLightMode } = useThemeStore();

  const currentIndex = queue.findIndex(t => t.id === (currentTrack?.id || ''));
  const nextUp = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

  // Dynamic light mode styles
  const bgStyleClass = isLightMode
    ? (glassmorphism ? 'bg-white/85 backdrop-blur-md text-black' : 'bg-[#f4f4f7] text-[#121212]')
    : (glassmorphism ? 'glass-panel-heavy' : 'bg-darkbg text-brightwhite');

  const textPrimaryClass = isLightMode ? 'text-black font-semibold' : 'text-brightwhite font-medium';
  const textSecondaryClass = isLightMode ? 'text-gray-500' : 'text-lightgray';
  const borderDividerClass = isLightMode ? 'border-gray-200' : 'border-white/5';
  const activeTrackBg = isLightMode ? 'bg-black/[0.03] border-gray-300' : 'border-white/5 bg-white/[0.03] shadow-premium';
  const hoverRowClass = isLightMode ? 'hover:bg-black/[0.03] hover:border-gray-300/30' : 'hover:border-white/5 hover:bg-white/[0.02]';

  return (
    <div className={`flex-1 flex flex-col p-6 select-none relative overflow-hidden h-full transition-colors duration-500 ${bgStyleClass}`}>
      
      {/* Drawer Header Controls */}
      <div className={`flex items-center justify-between border-b pb-4 mb-4 shrink-0 z-10 ${borderDividerClass}`}>
        <div className="flex items-center gap-2.5">
          <ArrowDownWideNarrow className="w-5 h-5" style={{ color: activeTheme.accent }} />
          <div>
            <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Cola de Reproducción</h3>
            <span className={`text-[10px] ${textSecondaryClass}`}>{queue.length} temas en cola</span>
          </div>
        </div>

        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              isLightMode ? 'text-gray-500 hover:text-red-500 hover:bg-black/[0.04]' : 'text-lightgray hover:text-red-500 hover:bg-white/5'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Cola</span>
          </button>
        )}
      </div>

      {/* Queue Body */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-5 z-10">
        {/* 1. Active Track Details */}
        {currentTrack && (
          <div className="space-y-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondaryClass} opacity-60`}>Sonando Ahora</span>
            <div 
              className={`flex items-center justify-between p-3 rounded-xl border group transition-all duration-300 ${activeTrackBg}`}
              style={{ borderLeft: `3px solid ${activeTheme.accent}` }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                  <img 
                    src={currentTrack.thumbnail} 
                    alt={currentTrack.title}
                    className="w-10 h-10 rounded-lg object-cover border border-white/10"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <Disc className="w-4 h-4 text-brightwhite animate-spin shrink-0" style={{ color: activeTheme.accent }} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className={`text-xs font-bold truncate ${textPrimaryClass}`}>{currentTrack.title}</span>
                  <span className={`text-[10px] truncate ${textSecondaryClass}`}>{currentTrack.artist}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold tabular-nums px-2 shrink-0 ${textSecondaryClass}`}>
                {currentTrack.duration}
              </span>
            </div>
          </div>
        )}

        {/* 2. Upcoming Songs Details */}
        <div className="space-y-2 flex-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondaryClass} opacity-60`}>Siguientes Canciones</span>
          
          {nextUp.length > 0 ? (
            <div className="space-y-1.5">
              {nextUp.map((track, idx) => (
                <div 
                  key={track.id + '-' + idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border border-transparent group transition-all duration-300 ${hoverRowClass}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative shrink-0">
                      <img 
                        src={track.thumbnail} 
                        alt={track.title}
                        className="w-9 h-9 rounded-lg object-cover border border-white/10"
                      />
                      <button
                        onClick={() => playTrack(track)}
                        className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4 fill-white text-brightwhite" />
                      </button>
                    </div>
                    <div className="flex flex-col truncate">
                      <span className={`text-xs font-semibold truncate ${textPrimaryClass}`}>{track.title}</span>
                      <span className={`text-[10px] truncate ${textSecondaryClass}`}>{track.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] tabular-nums hidden group-hover:inline ${textSecondaryClass}`}>
                      {track.duration}
                    </span>
                    <button
                      onClick={() => removeFromQueue(track.id)}
                      className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 ${
                        isLightMode ? 'text-gray-400 hover:text-red-500 hover:bg-black/[0.04]' : 'text-lightgray/40 hover:text-red-500 hover:bg-white/5'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-16 text-center opacity-40 gap-1.5`}>
              <Disc className="w-6 h-6 animate-pulse" />
              <span className="text-[11px]">No hay más canciones en la cola.</span>
              <span className="text-[9px]">Añade temas desde el Inicio o la Búsqueda.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
