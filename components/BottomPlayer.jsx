import React, { useState } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, RotateCcw, 
  Volume2, VolumeX, Mic2, ListMusic, BarChart2, Heart, ShoppingCart, Tv
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import ChromecastOverlay from './ChromecastOverlay';

export default function BottomPlayer({ setActiveTab }) {
  const { 
    currentTrack, isPlaying, volume, isMuted, progress, duration, 
    shuffle, repeatMode, showVisualizer, showQueue, showLyrics,
    togglePlay, next, prev, seek, setVolume, toggleMute, 
    toggleShuffle, toggleRepeat, toggleVisualizer, toggleQueue, toggleLyrics
  } = usePlayerStore();

  const { likedSongs, likeSong } = useAuthStore();
  const { activeTheme, isLightMode, glassmorphism } = useThemeStore();

  const isLiked = currentTrack ? likedSongs.some(s => s.id === currentTrack.id) : false;
  const [showCastMenu, setShowCastMenu] = useState(false);
  const [isCasting, setIsCasting] = useState(false);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimelineChange = (e) => {
    const val = parseFloat(e.target.value);
    seek(val);
    
    // Force sync when Host seeks manually
    const partyStore = require('../store/usePartyStore').usePartyStore.getState();
    if (partyStore.isHost) {
      partyStore.broadcastState({
        force: true,
        isPlaying: usePlayerStore.getState().isPlaying,
        currentTrack: usePlayerStore.getState().currentTrack,
        progress: val,
        duration: usePlayerStore.getState().duration
      });
    }
  };

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value));
  };

  // Dynamic light mode styles
  const footerBgClass = isLightMode ? 'bg-white border-gray-200 text-black' : 'bg-[#121212]/90 border-borderbg text-brightwhite';
  const textPrimaryClass = isLightMode ? 'text-black' : 'text-brightwhite';
  const textSecondaryClass = isLightMode ? 'text-gray-500' : 'text-lightgray';
  const controlBtnClass = isLightMode ? 'text-gray-500 hover:text-black hover:bg-black/[0.03]' : 'text-lightgray hover:text-brightwhite hover:bg-white/5';
  const sliderBgColor = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  return (
    <div className="px-6 pb-6 pt-2 shrink-0 select-none z-50">
      <footer 
        className={`h-20 flex items-center justify-between px-6 rounded-2xl border transition-all duration-500 shadow-2xl relative ${
          glassmorphism 
            ? 'backdrop-blur-xl bg-[#121212]/75' 
            : isLightMode 
              ? 'bg-white border-gray-200 text-black shadow-lg shadow-black/10' 
              : 'bg-[#121212] border-white/5 text-brightwhite'
        }`}
        style={{
          boxShadow: isPlaying ? `0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px -5px ${activeTheme.glow}` : undefined,
          borderColor: isPlaying ? `${activeTheme.accent}20` : undefined
        }}
      >
      
      {/* 1. Active Track Details */}
      <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
        {currentTrack ? (
          <>
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover border border-white/5 shadow-premium shadow-black/40 hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col truncate max-w-[150px]">
              <span className={`text-xs font-semibold truncate hover:underline cursor-pointer ${textPrimaryClass}`}>
                {currentTrack.title}
              </span>
              <span className={`text-[10px] truncate hover:underline cursor-pointer ${textSecondaryClass}`}>
                {currentTrack.artist}
              </span>
            </div>
            
            <button
              onClick={() => likeSong(currentTrack)}
              className={`p-1 rounded-lg hover:bg-white/5 transition-all ml-1 shrink-0 ${isLightMode ? 'text-gray-500 hover:text-black' : 'text-lightgray hover:text-brightwhite'}`}
            >
              <Heart 
                className={`w-4 h-4 transition-transform ${isLiked ? 'text-red-500 fill-red-500 scale-110' : ''}`} 
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-black/5 border border-white/5 flex items-center justify-center">
              <span className="opacity-40 text-[10px]">Empty</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${textSecondaryClass}`}>No track active</span>
              <span className="text-[9px] opacity-40">Pick a song from Home</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Central Playback Progress & Control Knobs */}
      <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[600px]">
        {/* Knobs */}
        <div className="flex items-center gap-5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            className={`p-1.5 rounded-lg transition-colors ${controlBtnClass}`}
          >
            <Shuffle className={`w-4 h-4 ${shuffle ? 'scale-110' : ''}`} style={shuffle ? { color: activeTheme.accent } : {}} />
          </button>

          {/* Prev */}
          <button
            onClick={prev}
            disabled={!currentTrack}
            className={`p-1.5 rounded-lg active:scale-95 disabled:opacity-30 ${controlBtnClass}`}
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Play/Pause Main Circle */}
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-8 h-8 rounded-full flex items-center justify-center text-black active:scale-90 hover:scale-105 transition-all shadow shadow-black/20 disabled:opacity-40"
            style={{ 
              backgroundColor: activeTheme.accent
            }}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={next}
            disabled={!currentTrack}
            className={`p-1.5 rounded-lg active:scale-95 disabled:opacity-30 ${controlBtnClass}`}
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            title={`Repeat mode: ${repeatMode}`}
            className={`p-1.5 rounded-lg transition-colors ${controlBtnClass}`}
          >
            <RotateCcw 
              className={`w-4 h-4 ${repeatMode !== 'off' ? 'scale-110' : ''}`} 
              style={repeatMode !== 'off' ? { color: activeTheme.accent } : {}}
            />
          </button>
        </div>

        {/* Timeline Progress Slider */}
        <div className="flex items-center gap-3 w-full">
          <span className={`text-[10px] tabular-nums w-8 text-right ${textSecondaryClass}`}>
            {formatTime(progress)}
          </span>
          
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={handleTimelineChange}
            disabled={!currentTrack}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none transition-colors"
            style={{
              background: `linear-gradient(to right, ${activeTheme.accent} 0%, ${activeTheme.accent} ${
                duration ? (progress / duration) * 100 : 0
              }%, ${sliderBgColor} ${
                duration ? (progress / duration) * 100 : 0
              }%, ${sliderBgColor} 100%)`
            }}
          />

          <span className={`text-[10px] tabular-nums w-8 text-left ${textSecondaryClass}`}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right Toggles & Mute controls */}
      <div className="flex items-center gap-3 w-[30%] min-w-[200px] justify-end">
        {/* Toggle Lyrics */}
        <button
          onClick={toggleLyrics}
          title="Synced Lyrics"
          className={`p-1 rounded-lg transition-all ${controlBtnClass}`}
          style={showLyrics ? { color: activeTheme.accent } : {}}
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Toggle Queue */}
        <button
          onClick={toggleQueue}
          title="Play Queue"
          className={`p-1 rounded-lg transition-all ${controlBtnClass}`}
          style={showQueue ? { color: activeTheme.accent } : {}}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Toggle Visualizer */}
        <button
          onClick={toggleVisualizer}
          title="Visualizer Equalizer"
          className={`p-1 rounded-lg transition-all ${controlBtnClass}`}
          style={showVisualizer ? { color: activeTheme.accent } : {}}
        >
          <BarChart2 className="w-4 h-4" />
        </button>

        {/* Chromecast Cast Button */}
        <div className="relative">
          <button
            onClick={() => setShowCastMenu(!showCastMenu)}
            title="Transmitir (Chromecast)"
            className={`p-1 rounded-lg transition-all ${controlBtnClass}`}
            style={isCasting ? { color: '#4ade80' } : {}}
          >
            <Tv className="w-4 h-4" />
          </button>

          {showCastMenu && (
            <div className={`absolute bottom-full right-0 mb-2 w-56 p-2 rounded-2xl border backdrop-blur-md shadow-2xl z-50 text-xs font-semibold ${
              isLightMode ? 'bg-white border-gray-200 text-black' : 'bg-[#18181c]/95 border-white/5 text-brightwhite'
            }`}>
              <p className="px-3 py-1.5 text-[10px] opacity-40 uppercase tracking-widest border-b border-white/5">Transmitir a dispositivo</p>
              <div className="py-1 space-y-0.5">
                {[
                  { name: 'Chromecast Salón', type: 'Chromecast' },
                  { name: 'Smart TV LG (Dormitorio)', type: 'LG WebOS' },
                  { name: 'Kero Speaker', type: 'Speaker' }
                ].map((dev, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsCasting(true);
                      setShowCastMenu(false);
                      const partyStore = require('../store/usePartyStore').usePartyStore.getState();
                      partyStore.showToast(`Conectado a ${dev.name}`);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between ${
                      isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <span>{dev.name}</span>
                    <span className="text-[9px] opacity-40 px-1.5 py-0.5 rounded bg-white/5">{dev.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`h-4 w-[1px] mx-0.5 ${isLightMode ? 'bg-gray-200' : 'bg-borderbg'}`} />

        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          title="Mute Toggle"
          className={`p-1 rounded-lg ${controlBtnClass}`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-500" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Volume Level slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 rounded-lg appearance-none cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, ${activeTheme.accent} 0%, ${activeTheme.accent} ${
              isMuted ? 0 : volume
            }%, ${sliderBgColor} ${
              isMuted ? 0 : volume
            }%, ${sliderBgColor} 100%)`
          }}
        />
      </div>
    </footer>

    {/* Chromecast Overlay TV Display */}
    {isCasting && (
      <ChromecastOverlay onClose={() => setIsCasting(false)} />
    )}
    </div>
  );
}
