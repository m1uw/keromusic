import { create } from 'zustand';

let fadeIntervalId = null;

export const usePlayerStore = create((set, get) => ({
  ytPlayer: null, // YouTube IFrame Player reference
  currentTrack: null, // Active song: { id, title, artist, thumbnail, duration }
  isPlaying: false,
  volume: 80,
  isMuted: false,
  progress: 0, // Current seek position in seconds
  duration: 0, // Length of song in seconds
  shuffle: false,
  repeatMode: 'off', // 'off' | 'all' | 'one'
  queue: [], // Tracks to play next
  history: [], // Tracks previously played
  showVisualizer: false,
  showQueue: false,
  showLyrics: false,
  compactMode: false,
  audioFade: true,
  eqEnabled: false,
  eqPreset: 'flat',
  eqGains: { '60': 0, '150': 0, '400': 0, '1000': 0, '3000': 0, '8000': 0, '15000': 0 },

  setAudioFade: (enabled) => {
    set({ audioFade: enabled });
    if (window.electron) window.electron.setSetting('audioFade', enabled);
  },

  setYtPlayer: (player) => {
    set({ ytPlayer: player });
    // Apply current volume
    if (player) {
      player.setVolume(get().isMuted ? 0 : get().volume);
    }
  },

  setEqEnabled: (enabled) => set({ eqEnabled: enabled }),
  
  setEqPreset: (preset) => {
    const presets = {
      flat: { '60': 0, '150': 0, '400': 0, '1000': 0, '3000': 0, '8000': 0, '15000': 0 },
      bass: { '60': 8, '150': 6, '400': 2, '1000': 0, '3000': 0, '8000': 0, '15000': 0 },
      vocal: { '60': -3, '150': -1, '400': 2, '1000': 5, '3000': 4, '8000': 1, '15000': 0 },
      electronic: { '60': 6, '150': 4, '400': 0, '1000': -2, '3000': 2, '8000': 4, '15000': 5 },
      classical: { '60': 4, '150': 3, '400': 2, '1000': 0, '3000': -2, '8000': -1, '15000': 2 },
      jazz: { '60': 3, '150': 2, '400': 1, '1000': -1, '3000': 1, '8000': 2, '15000': 3 }
    };
    const gains = presets[preset] || presets.flat;
    set({ eqPreset: preset, eqGains: gains });
  },

  updateEqGain: (band, gain) => {
    const nextGains = { ...get().eqGains, [band]: gain };
    set({ eqGains: nextGains, eqPreset: 'custom' });
  },

  // Toggle playback state
  togglePlay: () => {
    const { isPlaying, ytPlayer, currentTrack, queue, audioFade, volume, isMuted } = get();
    if (!currentTrack && queue.length > 0) {
      get().playTrack(queue[0]);
      return;
    }
    if (!currentTrack) return;

    if (fadeIntervalId) clearInterval(fadeIntervalId);

    if (isPlaying) {
      if (audioFade && volume > 0 && !isMuted) {
        let currentVol = volume;
        const step = volume / 20;
        fadeIntervalId = setInterval(() => {
          currentVol -= step;
          if (currentVol <= 0) {
            clearInterval(fadeIntervalId);
            fadeIntervalId = null;
            if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
              ytPlayer.setVolume(0);
              ytPlayer.pauseVideo();
            }
            set({ isPlaying: false });
          } else {
            if (ytPlayer && typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(currentVol);
          }
        }, 15);
      } else {
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
        set({ isPlaying: false });
      }
    } else {
      const targetVol = isMuted ? 0 : volume;
      if (audioFade && targetVol > 0) {
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
          ytPlayer.setVolume(0);
          ytPlayer.playVideo();
        }
        set({ isPlaying: true });
        
        let currentVol = 0;
        const step = targetVol / 20;
        fadeIntervalId = setInterval(() => {
          currentVol += step;
          if (currentVol >= targetVol) {
            clearInterval(fadeIntervalId);
            fadeIntervalId = null;
            if (ytPlayer && typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(targetVol);
          } else {
            if (ytPlayer && typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(currentVol);
          }
        }, 15);
      } else {
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
          ytPlayer.setVolume(targetVol);
          ytPlayer.playVideo();
        }
        set({ isPlaying: true });
      }
    }
    
    // Force sync for Listen Together
    const partyStore = require('./usePartyStore').usePartyStore.getState();
    if (partyStore.isHost) {
      partyStore.broadcastState({
        force: true,
        isPlaying: get().isPlaying,
        currentTrack: get().currentTrack,
        progress: get().progress,
        duration: get().duration
      });
    }
    get().syncTray();
  },

  // Play a specific track instantly
  playTrack: (track) => {
    const { ytPlayer, queue, history, currentTrack } = get();
    
    // Add current to history if switching
    let updatedHistory = [...history];
    if (currentTrack && currentTrack.id !== track.id) {
      updatedHistory = [currentTrack, ...updatedHistory].slice(0, 50); // limit history
    }

    // Add track to queue if not present
    const inQueue = queue.some(t => t.id === track.id);
    let updatedQueue = [...queue];
    if (!inQueue) {
      updatedQueue = [...queue, track];
    }

    set({ 
      currentTrack: track, 
      isPlaying: true, 
      progress: 0, 
      duration: 0, 
      queue: updatedQueue,
      history: updatedHistory
    });

    if (ytPlayer) {
      try {
        ytPlayer.loadVideoById({ videoId: track.id });
        ytPlayer.playVideo();
      } catch (err) {
        console.error('Failed to load video on iframe:', err);
      }
    }
    
    // Force sync for Listen Together
    const partyStore = require('./usePartyStore').usePartyStore.getState();
    if (partyStore.isHost) {
      partyStore.broadcastState({
        force: true,
        isPlaying: true,
        currentTrack: track,
        progress: 0,
        duration: 0
      });
    }

    get().syncTray();
  },

  // Skip to next track in queue
  next: () => {
    const { queue, currentTrack, shuffle, repeatMode } = get();
    if (queue.length === 0) return;

    let nextTrack = null;
    const currentIndex = queue.findIndex(t => t.id === (currentTrack?.id || ''));

    if (repeatMode === 'one' && currentTrack) {
      nextTrack = currentTrack;
    } else if (shuffle) {
      // Pick random song
      const filtered = queue.filter(t => t.id !== currentTrack?.id);
      if (filtered.length > 0) {
        nextTrack = filtered[Math.floor(Math.random() * filtered.length)];
      } else {
        nextTrack = currentTrack;
      }
    } else {
      // Standard linear progression
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        nextTrack = queue[currentIndex + 1];
      } else if (repeatMode === 'all') {
        nextTrack = queue[0]; // Wrap around
      }
    }

    if (nextTrack) {
      get().playTrack(nextTrack);
    } else {
      // End of queue and no repeat
      set({ isPlaying: false, progress: 0 });
      if (get().ytPlayer && typeof get().ytPlayer.stopVideo === 'function') {
        get().ytPlayer.stopVideo();
      }
      get().syncTray();
    }
  },

  // Skip back to previous track
  prev: () => {
    const { queue, currentTrack, history } = get();
    
    // If song is more than 3 seconds in, restart it
    if (get().progress > 3) {
      get().seek(0);
      return;
    }

    if (history.length > 0) {
      const prevTrack = history[0];
      const updatedHistory = history.slice(1);
      set({ history: updatedHistory });
      get().playTrack(prevTrack);
    } else {
      // Fallback: previous in queue list
      const currentIndex = queue.findIndex(t => t.id === (currentTrack?.id || ''));
      if (currentIndex > 0) {
        get().playTrack(queue[currentIndex - 1]);
      }
    }
  },

  // Seek timeline position
  seek: (seconds) => {
    const { ytPlayer } = get();
    set({ progress: seconds });
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      ytPlayer.seekTo(seconds, true);
    }
  },

  // Volume slider control
  setVolume: (value) => {
    const { ytPlayer } = get();
    set({ volume: value, isMuted: value === 0 });
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(value);
    }
    if (window.electron) {
      window.electron.setSetting('volume', value);
    }
  },

  toggleMute: () => {
    const { isMuted, volume, ytPlayer } = get();
    const nextMute = !isMuted;
    set({ isMuted: nextMute });
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(nextMute ? 0 : volume);
    }
  },

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleRepeat: () => set((state) => {
    const modes = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIdx] };
  }),

  // Queue adjustments
  addToQueue: (track) => {
    const inQueue = get().queue.some(t => t.id === track.id);
    if (!inQueue) {
      set((state) => ({ queue: [...state.queue, track] }));
    }
  },

  removeFromQueue: (trackId) => set((state) => ({
    queue: state.queue.filter(t => t.id !== trackId)
  })),

  clearQueue: () => set({ queue: [] }),

  // Toggle overlay panels
  toggleVisualizer: () => set((state) => ({ showVisualizer: !state.showVisualizer, showQueue: false, showLyrics: false })),
  toggleQueue: () => set((state) => ({ showQueue: !state.showQueue, showVisualizer: false, showLyrics: false })),
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics, showVisualizer: false, showQueue: false })),
  
  setCompactMode: (compact) => {
    set({ compactMode: compact });
    if (window.electron) {
      window.electron.setCompact(compact);
    }
  },

  // Local settings restore
  initPlayer: async () => {
    if (window.electron) {
      const savedVol = await window.electron.getSetting('volume', 80);
      const savedFade = await window.electron.getSetting('audioFade', true);
      set({ volume: savedVol, audioFade: savedFade });
    }
  },

  // Bridge synchronization with System Tray and Discord RPC
  syncTray: () => {
    const { isPlaying, currentTrack, progress, duration } = get();
    if (window.electron) {
      window.electron.updateTrayStatus(isPlaying, currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : '');
      window.electron.updateDiscordRPC(currentTrack, isPlaying, progress, duration);
    }
  }
}));
