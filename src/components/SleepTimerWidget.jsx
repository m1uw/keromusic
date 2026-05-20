import React, { useState, useEffect } from 'react';
import { Clock, Pause, Sparkles, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';
import { usePartyStore } from '../store/usePartyStore';

export default function SleepTimerWidget() {
  const { isPlaying, togglePlay } = usePlayerStore();
  const { activeTheme, isLightMode } = useThemeStore();
  
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // When countdown hits 0, pause music!
          const playerState = usePlayerStore.getState();
          if (playerState.isPlaying) {
            playerState.togglePlay();
            usePartyStore.getState().showToast("Apagado automático: Música pausada.");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSetTimer = (minutes) => {
    setTimeLeft(minutes * 60);
    usePartyStore.getState().showToast(`Temporizador configurado en ${minutes} minutos.`);
    setIsOpen(false);
  };

  const borderClass = isLightMode ? 'border-gray-200 shadow-lg shadow-black/5' : 'border-white/5 shadow-2xl';
  const bgClass = isLightMode ? 'bg-white/95 text-black' : 'bg-[#151518]/95 text-brightwhite';

  return (
    <div className="fixed bottom-24 left-6 z-[999] select-none">
      {/* Floating Toggle Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 border relative group"
        style={{ 
          backgroundColor: timeLeft > 0 ? activeTheme.accent : 'rgba(20, 20, 20, 0.75)',
          borderColor: timeLeft > 0 ? 'transparent' : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <Clock className={`w-4 h-4 ${timeLeft > 0 ? 'text-black fill-black animate-pulse' : 'text-brightwhite'}`} />
        {timeLeft > 0 && (
          <span className="absolute -top-1 -right-1 text-[8px] bg-red-600 text-white font-bold rounded-full w-4 h-4 flex items-center justify-center border border-black animate-bounce">
            zZ
          </span>
        )}
      </button>

      {/* Expanded Control Menu */}
      {isOpen && (
        <div 
          className={`absolute bottom-12 left-0 w-52 p-4 rounded-2xl border backdrop-blur-xl animate-scale-up ${bgClass} ${borderClass}`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Sleep Timer
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/5 rounded-lg text-lightgray hover:text-brightwhite"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {timeLeft > 0 ? (
            <div className="text-center space-y-3.5 py-1">
              <div className="text-xl font-mono font-black tracking-widest tabular-nums animate-pulse" style={{ color: activeTheme.accent }}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-[9px] opacity-60">La reproducción se pausará de forma automática.</p>
              <button 
                onClick={() => setTimeLeft(0)}
                className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl text-[10px] transition-all border border-red-500/10"
              >
                Cancelar Temporizador
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {[5, 15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleSetTimer(mins)}
                  className="w-full py-1.5 px-3 rounded-xl hover:bg-white/5 transition-all text-left text-xs font-semibold flex items-center justify-between"
                >
                  <span>{mins} Minutos</span>
                  <span className="text-[9px] opacity-40">zZ</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
