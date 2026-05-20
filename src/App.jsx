import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomPlayer from './components/BottomPlayer';
import MainView from './components/MainView';
import Visualizer from './components/Visualizer';
import LyricsPanel from './components/LyricsPanel';
import QueuePanel from './components/QueuePanel';
import CompactPlayer from './components/CompactPlayer';
import NekoCat from './components/NekoCat';
import SleepTimerWidget from './components/SleepTimerWidget';

import { usePlayerStore } from './store/usePlayerStore';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { usePartyStore } from './store/usePartyStore';
import { youtubeService } from './services/youtubeService';

import { X, Sparkles, Plus, Download, Loader2, Home, Search, Library, Users, Settings } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Playlist Modal Controls
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistModalTab, setPlaylistModalTab] = useState('create'); // 'create' | 'import'
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');

  const {
    setYtPlayer, isPlaying, progress, next, prev, togglePlay,
    showVisualizer, showQueue, showLyrics, compactMode, setCompactMode,
    eqEnabled, eqGains
  } = usePlayerStore();

  const { initTheme, activeTheme, isLightMode, layoutSkin, activeExtensions } = useThemeStore();
  const { initAuth, createPlaylist, importYoutubePlaylist, isLoading: authLoading } = useAuthStore();
  const { initPlayer } = usePlayerStore();

  const intervalRef = useRef(null);
  const playerRef = useRef(null);

  // Initialize storage caching on mount
  useEffect(() => {
    initTheme();
    initAuth();
    initPlayer();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up tray listener hooks
  useEffect(() => {
    if (window.electron) {
      const unsubMedia = window.electron.receive('media-command', (command) => {
        switch (command) {
          case 'play-pause':
            togglePlay();
            break;
          case 'next':
            next();
            break;
          case 'prev':
            prev();
            break;
          case 'stop':
            if (isPlaying) togglePlay();
            break;
        }
      });

      // Window resize transitions from main process
      const unsubWindowState = window.electron.receive('window-state-changed', (state) => {
        // Direct Zustand modification completely bypasses the recursive callback loop!
        usePlayerStore.setState({ compactMode: state === 'compact' });
      });

      return () => {
        unsubMedia();
        unsubWindowState();
      };
    }
  }, [isPlaying, togglePlay, next, prev]);

  // Load and mount the official YouTube Player IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initYTPlayer = () => {
      playerRef.current = new window.YT.Player('yt-hidden-player', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          origin: 'https://music.youtube.com'
        },
        events: {
          onReady: (event) => {
            // Register player reference inside state store
            setYtPlayer(event.target);
          },
          onStateChange: (event) => {
            // When track completes (state === 0), auto play next track
            if (event.data === window.YT.PlayerState.ENDED) {
              next();
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              usePlayerStore.setState({ isPlaying: true });
              
              // 7-Band Dynamic DSP Equalizer Hookup!
              try {
                const iframe = document.getElementById('yt-hidden-player');
                if (iframe) {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (iframeDoc) {
                    const video = iframeDoc.querySelector('video');
                    if (video) {
                      // Initialise AudioContext on play gesture
                      if (!window.audioCtx) {
                        window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                      }
                      if (window.audioCtx.state === 'suspended') {
                        window.audioCtx.resume();
                      }
                      
                      // Connect routing chain ONLY once
                      if (!video.audioSourceSynced) {
                        const source = window.audioCtx.createMediaElementSource(video);
                        const bands = [60, 150, 400, 1000, 3000, 8000, 15000];
                        const filters = bands.map((hz) => {
                          const filter = window.audioCtx.createBiquadFilter();
                          filter.type = 'peaking';
                          filter.frequency.value = hz;
                          filter.Q.value = 1.0;
                          filter.gain.value = 0;
                          return filter;
                        });
                        
                        let lastNode = source;
                        filters.forEach(filter => {
                          lastNode.connect(filter);
                          lastNode = filter;
                        });
                        lastNode.connect(window.audioCtx.destination);
                        
                        video.audioSourceSynced = true;
                        window.eqFilters = filters;
                        console.log('[DSP] Connected 7-Band Equalizer hardware acceleration!');
                        
                        // Hydrate immediately with active gains
                        const activeGains = usePlayerStore.getState().eqGains;
                        const isEqEnabled = usePlayerStore.getState().eqEnabled;
                        const bandKeys = ['60', '150', '400', '1000', '3000', '8000', '15000'];
                        bandKeys.forEach((key, idx) => {
                          if (filters[idx]) {
                            filters[idx].gain.value = isEqEnabled ? (activeGains[key] || 0) : 0;
                          }
                        });
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn('[DSP] Accessing iframe blocked or failed:', err);
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              usePlayerStore.setState({ isPlaying: false });
            }
            usePlayerStore.getState().syncTray();
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initYTPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Update EQ bands dynamically in Web Audio filters when user changes sliders
  useEffect(() => {
    if (window.eqFilters) {
      const bandKeys = ['60', '150', '400', '1000', '3000', '8000', '15000'];
      const isHiFi = activeExtensions.includes('hifi-dac');
      
      bandKeys.forEach((key, idx) => {
        if (window.eqFilters[idx]) {
          let gainVal = eqEnabled ? (eqGains[key] || 0) : 0;
          if (isHiFi) {
            // Hi-Fi DAC: +6dB bass, +5dB high-end clarity
            if (key === '60' || key === '150') gainVal += 6.0;
            if (key === '8000' || key === '15000') gainVal += 5.0;
          }
          window.eqFilters[idx].gain.value = gainVal;
        }
      });
      console.log(`[DSP] Equalizer updated. Hi-Fi DAC state: ${isHiFi}`);
    }
  }, [eqEnabled, eqGains, activeExtensions]);

  // Set up tick timer to synchronise progress timeline
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          usePlayerStore.setState({ progress: curr, duration: dur });
          
          const partyState = usePartyStore.getState();
          if (partyState.isHost) {
            partyState.broadcastState({
              isPlaying: true,
              currentTrack: usePlayerStore.getState().currentTrack,
              progress: curr,
              duration: dur
            });
          }
        }
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      const partyState = usePartyStore.getState();
      if (partyState.isHost && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        partyState.broadcastState({
          force: true,
          isPlaying: false,
          currentTrack: usePlayerStore.getState().currentTrack,
          progress: playerRef.current.getCurrentTime(),
          duration: playerRef.current.getDuration()
        });
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handleSearch = async (query) => {
    const results = await youtubeService.search(query);
    setSearchResults(results);
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setActiveTab('playlist');
    usePlayerStore.setState({ showLyrics: false, showVisualizer: false, showQueue: false });
  };

  // Actions for Playlist modals
  const handleCreatePlaylist = () => {
    if (!newTitle.trim()) return;
    const created = createPlaylist(newTitle, newDesc);
    setNewTitle('');
    setNewDesc('');
    setShowPlaylistModal(false);

    // Auto-select and show the new playlist
    setSelectedPlaylist(created);
    setActiveTab('playlist');
  };

  const handleImportPlaylist = async () => {
    if (!importUrl.trim()) return;
    setImportError('');
    const res = await importYoutubePlaylist(importUrl);
    if (res.success) {
      setImportUrl('');
      setShowPlaylistModal(false);
      setSelectedPlaylist(res.playlist);
      setActiveTab('playlist');
    } else {
      setImportError(res.error);
    }
  };

  const bgStyle = isLightMode ? 'bg-[#f4f4f7] text-[#121212]' : 'bg-darkbg text-brightwhite';

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-500 skin-${layoutSkin} ${bgStyle}`}>

      {/* 
        Active but invisible YouTube player container.
        Keeps 1x1 visible dimensions so Chromium never suspends background media audio playback! 
      */}
      <div className="absolute bottom-4 right-4 w-1.5 h-1.5 pointer-events-none opacity-[0.002] z-0 overflow-hidden">
        <div id="yt-hidden-player" />
      </div>

      {compactMode ? (
        // COMPACT MINI-PLAYER mode
        <div className="flex-1 flex overflow-hidden">
          <CompactPlayer />
        </div>
      ) : (
        // STANDARD DASHBOARD mode
        <>
          {/* Custom Window Title bar */}
          <Topbar
            onSearch={handleSearch}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="flex-1 flex overflow-hidden relative">

            {/* Sidebar navigation */}
            {!isMobile && (
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSelectPlaylist={handleSelectPlaylist}
                onOpenPlaylistModal={() => setShowPlaylistModal(true)}
              />
            )}

            {/* Primary Visual viewport switcher */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {showVisualizer ? (
                <Visualizer />
              ) : showLyrics ? (
                <LyricsPanel />
              ) : showQueue ? (
                <QueuePanel />
              ) : (
                <MainView
                  activeTab={activeTab}
                  searchResults={searchResults}
                  selectedPlaylist={selectedPlaylist}
                  setSelectedPlaylist={setSelectedPlaylist}
                  setActiveTab={setActiveTab}
                />
              )}
            </main>
          </div>

          {/* Persistent Player controls footer */}
          <BottomPlayer setActiveTab={setActiveTab} />

          {/* Mobile Bottom Navigation Bar */}
          {isMobile && (
            <div 
              className="shrink-0 bg-[#121212]/95 border-t border-white/5 flex items-center justify-around px-4 select-none relative z-50 backdrop-blur-md"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(4rem + env(safe-area-inset-bottom))' }}
            >
              {[
                { tab: 'home', label: 'Inicio', icon: <Home className="w-4.5 h-4.5" /> },
                { tab: 'search', label: 'Buscar', icon: <Search className="w-4.5 h-4.5" /> },
                { tab: 'library', label: 'Biblioteca', icon: <Library className="w-4.5 h-4.5" /> },
                { tab: 'party', label: 'Social', icon: <Users className="w-4.5 h-4.5" /> },
                { tab: 'settings', label: 'Ajustes', icon: <Settings className="w-4.5 h-4.5" /> }
              ].map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      usePlayerStore.setState({ showLyrics: false, showVisualizer: false, showQueue: false });
                    }}
                    className="flex flex-col items-center gap-1 transition-all text-lightgray/60 hover:text-white"
                    style={isActive ? { color: activeTheme.accent } : {}}
                  >
                    {item.icon}
                    <span className="text-[8px] font-bold tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Global Toasts */}
          {usePartyStore.getState().toast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[9999] bg-green-500/20 border border-green-500/50 text-white px-6 py-3 rounded-full shadow-lg shadow-green-500/10 backdrop-blur-md animate-scale-up text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {usePartyStore.getState().toast}
            </div>
          )}

          {/* Extensions */}
          {activeExtensions.includes('neko-cat') && <NekoCat />}
          {activeExtensions.includes('sleep-timer') && <SleepTimerWidget />}
        </>
      )}

      {/* 6. CREATE / IMPORT PLAYLIST POPUP MODAL OVERLAY */}
      {showPlaylistModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] transition-all">
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 w-[420px] shadow-2xl relative space-y-6 animate-scale-up text-brightwhite">

            {/* Close Button */}
            <button
              onClick={() => {
                setShowPlaylistModal(false);
                setImportError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-lightgray hover:text-brightwhite transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Plus className="w-5 h-5" style={{ color: activeTheme.accent }} />
                <span>Añadir Nueva Playlist</span>
              </h3>
              <p className="text-[10px] text-lightgray/50">Crea una carpeta vacía o importa música de YouTube</p>
            </div>

            {/* Modal Tabs selectors */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
              <button
                onClick={() => setPlaylistModalTab('create')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${playlistModalTab === 'create'
                    ? 'bg-white/10 text-brightwhite shadow'
                    : 'text-lightgray hover:text-brightwhite'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Crear desde Cero</span>
              </button>
              <button
                onClick={() => setPlaylistModalTab('import')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${playlistModalTab === 'import'
                    ? 'bg-white/10 text-brightwhite shadow'
                    : 'text-lightgray hover:text-brightwhite'
                  }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Importar Playlist</span>
              </button>
            </div>

            {/* TAB CONTENT 1: CREATE FROM ZERO */}
            {playlistModalTab === 'create' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-lightgray/70">Nombre de la Playlist</label>
                  <input
                    type="text"
                    placeholder="Ej. Programando a Altas Horas"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-brightwhite focus:outline-none focus:border-white/20 placeholder-lightgray/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-lightgray/70">Descripción (Opcional)</label>
                  <textarea
                    placeholder="Ej. Temas instrumentales muy relajantes..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows="3"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-brightwhite focus:outline-none focus:border-white/20 placeholder-lightgray/30 resize-none"
                  />
                </div>

                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newTitle.trim()}
                  className="w-full py-3 rounded-xl font-bold text-xs text-black active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: activeTheme.accent }}
                >
                  Crear Playlist
                </button>
              </div>
            )}

            {/* TAB CONTENT 2: IMPORT YOUTUBE PLAYLIST */}
            {playlistModalTab === 'import' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-lightgray/70">Enlace o ID de Playlist de YouTube</label>
                  <input
                    type="text"
                    placeholder="Ej. https://www.youtube.com/playlist?list=PL..."
                    value={importUrl}
                    onChange={(e) => {
                      setImportUrl(e.target.value);
                      setImportError('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-brightwhite focus:outline-none focus:border-white/20 placeholder-lightgray/30"
                  />
                  {importError && (
                    <p className="text-[10px] text-red-500 font-medium">{importError}</p>
                  )}
                </div>

                <button
                  onClick={handleImportPlaylist}
                  disabled={!importUrl.trim() || authLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs text-black active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: activeTheme.accent }}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extrayendo playlist de YT...</span>
                    </>
                  ) : (
                    <span>Importar Playlist</span>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
