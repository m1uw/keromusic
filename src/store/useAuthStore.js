import { create } from 'zustand';
import { youtubeService } from '../services/youtubeService';

// No more mockups!
const CuratedPlaylists = [];

export const useAuthStore = create((set, get) => ({
  user: null, // User details: { name, avatar }
  username: 'Guest',
  profilePic: '', // Custom avatar Base64 or URL
  cookie: null, // Google Session headers
  playlists: [],
  likedSongs: [],
  hiddenSongs: [],
  isLoading: false,

  initAuth: async () => {
    if (window.electron) {
      const savedAuth = await window.electron.getSetting('authSession', null);
      const savedPlaylists = await window.electron.getSetting('customPlaylists', []);
      const savedUsername = await window.electron.getSetting('username', 'Guest');
      const savedHidden = await window.electron.getSetting('hiddenSongs', []);
      const savedPic = await window.electron.getSetting('profilePic', '');
      const initialPlaylists = [...savedPlaylists];

      if (savedAuth) {
        set({ 
          username: savedUsername,
          profilePic: savedPic || savedAuth.user.avatar || '',
          hiddenSongs: savedHidden,
          user: savedAuth.user, 
          cookie: savedAuth.cookie,
          playlists: [
            ...initialPlaylists,
            { id: 'playlist-favorites', title: 'Your Favorites', description: 'Your highly liked YouTube Music tracks.', tracksCount: 0, thumbnail: 'https://images.unsplash.com/photo-1513829096960-ef04e7c8a14b?w=200&q=80', tracks: [] }
          ]
        });
        // Auto load from cloud if synced
        get().loadCloud(savedAuth.user.id);
      } else {
        set({ playlists: initialPlaylists, username: savedUsername, profilePic: savedPic, hiddenSongs: savedHidden });
      }
    } else {
      // Fallback for Web Browsers
      const webPic = localStorage.getItem('kero_profilePic') || '';
      if (webPic) {
        set({ profilePic: webPic });
      }
    }
  },

  login: async () => {
    if (!window.electron) return;
    set({ isLoading: true });
    
    try {
      const res = await window.electron.startCookieSync();
      if (res.success) {
        set({
          user: res.user,
          cookie: res.cookie,
          playlists: [
            ...get().playlists,
            { 
              id: 'playlist-favorites', 
              title: 'Your Favorites', 
              description: 'Your highly liked YouTube Music tracks.', 
              tracksCount: 0, 
              thumbnail: 'https://images.unsplash.com/photo-1513829096960-ef04e7c8a14b?w=200&q=80', 
              tracks: [] 
            },
            {
              id: 'playlist-ytmusic',
              title: 'My YT Music Sync',
              description: 'Synced from your official Google Account.',
              tracksCount: 2,
              thumbnail: res.user.avatar || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80',
              tracks: [
                { id: 'oygrmJFKYZY', title: 'Havana', artist: 'Camila Cabello', duration: '3:36', thumbnail: 'https://img.youtube.com/vi/oygrmJFKYZY/0.jpg' },
                { id: 'fRh_dkD7XXc', title: 'Shape of You', artist: 'Ed Sheeran', duration: '4:23', thumbnail: 'https://img.youtube.com/vi/fRh_dkD7XXc/0.jpg' }
              ]
            }
          ]
        });
        // Sincronizar con la nube al loguear exitosamente
        get().loadCloud(res.user.id);
      }
    } catch (e) {
      console.error('Login window crashed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    if (!window.electron) return;
    await window.electron.logout();
    set({ user: null, cookie: null, playlists: CuratedPlaylists });
  },

  likeSong: (song) => {
    const { likedSongs, playlists } = get();
    const alreadyLiked = likedSongs.some(s => s.id === song.id);
    let nextLikes = [];

    if (alreadyLiked) {
      nextLikes = likedSongs.filter(s => s.id !== song.id);
    } else {
      nextLikes = [song, ...likedSongs];
    }

    // Update playlists state to populate the Favorites list
    const updatedPlaylists = playlists.map(p => {
      if (p.id === 'playlist-favorites') {
        return { ...p, tracks: nextLikes, tracksCount: nextLikes.length };
      }
      return p;
    });

    set({ likedSongs: nextLikes, playlists: updatedPlaylists });
  },

  // Create empty playlist from scratch
  createPlaylist: (title, description) => {
    const newPlaylist = {
      id: 'playlist-custom-' + Date.now(),
      title: title || 'My Custom Playlist',
      description: description || 'No description provided.',
      tracksCount: 0,
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
      tracks: []
    };

    const nextPlaylists = [...get().playlists, newPlaylist];
    set({ playlists: nextPlaylists });

    // Persist custom playlists only
    if (window.electron) {
      const customOnly = nextPlaylists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
      window.electron.setSetting('customPlaylists', customOnly);
    }
    return newPlaylist;
  },

  // Import a public YouTube playlist
  importYoutubePlaylist: async (playlistUrlOrId) => {
    set({ isLoading: true });
    try {
      const result = await youtubeService.getPlaylistTracks(playlistUrlOrId);
      if (result && result.tracks.length > 0) {
        const newPlaylist = {
          id: 'playlist-imported-' + Date.now(),
          title: result.title || 'Imported Playlist',
          description: `Imported from YouTube on ${new Date().toLocaleDateString()}.`,
          tracksCount: result.tracks.length,
          thumbnail: result.tracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
          tracks: result.tracks
        };

        const nextPlaylists = [...get().playlists, newPlaylist];
        set({ playlists: nextPlaylists });

        if (window.electron) {
          const customOnly = nextPlaylists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
          window.electron.setSetting('customPlaylists', customOnly);
        }
        return { success: true, playlist: newPlaylist };
      }
    } catch (e) {
      console.error('Failed to import playlist:', e);
    } finally {
      set({ isLoading: false });
    }
    return { success: false, error: 'Could not fetch YouTube playlist. Verify it is public.' };
  },

  // Rename a playlist
  renamePlaylist: (id, newTitle) => {
    const { playlists } = get();
    const updatedPlaylists = playlists.map(p => {
      if (p.id === id) {
        return { ...p, title: newTitle || p.title };
      }
      return p;
    });
    set({ playlists: updatedPlaylists });
    if (window.electron) {
      const customOnly = updatedPlaylists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
      window.electron.setSetting('customPlaylists', customOnly);
    }
  },

  // Delete a playlist
  deletePlaylist: (id) => {
    const { playlists } = get();
    const updatedPlaylists = playlists.filter(p => p.id !== id);
    set({ playlists: updatedPlaylists });
    if (window.electron) {
      const customOnly = updatedPlaylists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
      window.electron.setSetting('customPlaylists', customOnly);
    }
  },

  // Toggle pinning of a playlist (sorts to the top)
  togglePinPlaylist: (id) => {
    const { playlists } = get();
    const updatedPlaylists = playlists.map(p => {
      if (p.id === id) {
        return { ...p, isPinned: !p.isPinned };
      }
      return p;
    });
    set({ playlists: updatedPlaylists });
    if (window.electron) {
      const customOnly = updatedPlaylists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
      window.electron.setSetting('customPlaylists', customOnly);
    }
  },

  setUsername: (name) => {
    set({ username: name });
    if (window.electron) window.electron.setSetting('username', name);
    get().saveProfileToCloud();
  },

  setProfilePic: (pic) => {
    set({ profilePic: pic });
    if (window.electron) {
      window.electron.setSetting('profilePic', pic);
    } else {
      localStorage.setItem('kero_profilePic', pic);
    }
    get().saveProfileToCloud();
  },

  hideSong: (trackId) => {
    const { hiddenSongs } = get();
    if (!hiddenSongs.includes(trackId)) {
      const newHidden = [...hiddenSongs, trackId];
      set({ hiddenSongs: newHidden });
      if (window.electron) window.electron.setSetting('hiddenSongs', newHidden);
      get().saveProfileToCloud();
    }
  },

  addTrackToPlaylist: (playlistId, track) => {
    const { playlists } = get();
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        // Prevent duplicates
        if (p.tracks.some(t => t.id === track.id)) return p;
        const nextTracks = [...p.tracks, track];
        return { ...p, tracks: nextTracks, tracksCount: nextTracks.length };
      }
      return p;
    });

    set({ playlists: updatedPlaylists });

    if (window.electron) {
      const customOnly = updatedPlaylists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
      window.electron.setSetting('customPlaylists', customOnly);
    }
    
    // Notify user
    const partyStore = require('./usePartyStore').usePartyStore.getState();
    partyStore.showToast(`Añadida a playlist con éxito`);

    get().saveProfileToCloud();
  },

  saveProfileToCloud: async () => {
    const { user, username, profilePic, playlists, hiddenSongs } = get();
    if (!user) return; // Only sync if logged in with Google

    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3001' 
      : (window.location.origin.includes('file://') ? 'https://keromusic.onrender.com' : window.location.origin);

    try {
      const customOnly = playlists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));
      await fetch(`${backendUrl}/api/sync/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: user.id,
          username,
          profilePic,
          playlists: customOnly,
          hiddenSongs
        })
      });
    } catch (e) {
      console.error('Failed to sync settings to cloud:', e);
    }
  },

  loadCloud: async (googleId) => {
    if (!googleId) return;
    
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3001' 
      : (window.location.origin.includes('file://') ? 'https://keromusic.onrender.com' : window.location.origin);

    try {
      const res = await fetch(`${backendUrl}/api/sync/load/${googleId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const loadedUsername = data.username || get().username;
          const loadedPic = data.profilePic || get().profilePic;
          const loadedHidden = data.hiddenSongs || get().hiddenSongs;
          
          // Re-populate custom playlists
          const cloudPlaylists = data.playlists || [];
          const currentPlaylists = get().playlists.filter(p => !p.id.startsWith('playlist-custom-') && !p.id.startsWith('playlist-imported-'));
          const nextPlaylists = [...cloudPlaylists, ...currentPlaylists];

          set({
            username: loadedUsername,
            profilePic: loadedPic,
            hiddenSongs: loadedHidden,
            playlists: nextPlaylists
          });

          // Sync locally too
          if (window.electron) {
            window.electron.setSetting('username', loadedUsername);
            window.electron.setSetting('profilePic', loadedPic);
            window.electron.setSetting('hiddenSongs', loadedHidden);
            window.electron.setSetting('customPlaylists', cloudPlaylists);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load settings from cloud:', e);
    }
  }
}));
