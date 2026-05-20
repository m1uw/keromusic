import { create } from 'zustand';
import { io } from 'socket.io-client';
import { usePlayerStore } from './usePlayerStore';
import { useAuthStore } from './useAuthStore';

// Update this to your deployed Render URL
const SERVER_URL = 'https://keromusic.onrender.com';

// Keep-alive ping to prevent Render's free tier from sleeping while the app is running
setInterval(() => {
  fetch(`${SERVER_URL}/ping`).catch(() => {});
}, 300000); // Ping every 5 minutes (300,000ms)

export const usePartyStore = create((set, get) => ({
  socket: null,
  partyId: null,
  isHost: false,
  membersCount: 0,
  members: [],
  error: null,
  isConnecting: false,
  toast: null,

  showToast: (message) => {
    set({ toast: message });
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
    setTimeout(() => set({ toast: null }), 4000);
  },

  initSocket: () => {
    if (!get().socket) {
      const socket = io(SERVER_URL, {
        autoConnect: false
      });

      socket.on('connect', () => {
        set({ isConnecting: false });
      });

      socket.on('disconnect', () => {
        set({ partyId: null, isHost: false, membersCount: 0 });
      });

      socket.on('party_created', ({ partyId }) => {
        set({ partyId, isHost: true, membersCount: 1, error: null });
        get().showToast('¡Sala creada! Copia el código e invita amigos.');
      });

      socket.on('member_joined', ({ membersCount, members, joinedName }) => {
        set({ membersCount, members });
        get().showToast(`${joinedName} se ha unido a la sala.`);
      });

      socket.on('member_left', ({ membersCount, members, leftName }) => {
        set({ membersCount, members });
        get().showToast(`${leftName} ha salido de la sala.`);
      });

      socket.on('party_disbanded', () => {
        set({ partyId: null, isHost: false, membersCount: 0, error: 'La sesión fue cerrada por el anfitrión.' });
        get().socket.disconnect();
      });

      socket.on('error', (err) => {
        set({ error: err.message, isConnecting: false });
      });

      socket.on('sync_state', (state) => {
        if (!get().isHost) {
          // We are a guest, apply state to our local player
          const { playTrack, togglePlay, seek, isPlaying, currentTrack } = usePlayerStore.getState();
          
          if (state.currentTrack) {
            // If track is different, play it
            if (!currentTrack || currentTrack.id !== state.currentTrack.id) {
              playTrack(state.currentTrack);
            }
            
            // Adjust time if drift is > 2 seconds
            const now = Date.now();
            const timePassed = (now - state.timestamp) / 1000;
            const expectedProgress = state.progress + (state.isPlaying ? timePassed : 0);
            
            const currentLocalProgress = usePlayerStore.getState().progress;
            
            // Fix loop: Only seek if difference is large (e.g. > 3 seconds)
            // AND ensure we don't spam seeks
            if (Math.abs(currentLocalProgress - expectedProgress) > 3) {
              seek(expectedProgress);
            }

            // Sync play/pause state
            if (state.isPlaying !== isPlaying) {
              togglePlay();
            }
          }
        }
      });

      set({ socket });
    }
  },

  createParty: () => {
    get().initSocket();
    const socket = get().socket;
    set({ isConnecting: true, error: null });
    socket.connect();
    socket.emit('create_party', { username: useAuthStore.getState().username });
  },

  joinParty: (partyId) => {
    get().initSocket();
    const socket = get().socket;
    set({ isConnecting: true, error: null });
    socket.connect();
    socket.emit('join_party', { partyId, username: useAuthStore.getState().username });
  },

  leaveParty: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }
    set({ partyId: null, isHost: false, membersCount: 0, error: null });
  },

  lastBroadcastTime: 0,

  broadcastState: (state) => {
    const { socket, partyId, isHost, lastBroadcastTime } = get();
    const now = Date.now();
    
    // Throttle automatic broadcasts (like progress ticks) to every 5 seconds.
    // If state.force is true (like manual play/pause/seek), bypass throttle.
    if (socket && partyId && isHost) {
      if (state.force || now - lastBroadcastTime > 5000) {
        socket.emit('update_state', { partyId, state });
        set({ lastBroadcastTime: now });
      }
    }
  }
}));
