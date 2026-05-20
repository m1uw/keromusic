import React, { useEffect, useState } from 'react';
import { Play, Plus, Clock, Flame, Sparkles, Coffee, Heart, Check, Music, Sun, Moon, Sparkle, Sliders, Shield, Library, Store, Zap, Users, Link, Copy, LogOut, Search, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePartyStore } from '../store/usePartyStore';
import { youtubeService } from '../services/youtubeService';
import GraphicEQ from './GraphicEQ';
import ContextMenu from './ContextMenu';

export default function MainView({ activeTab, searchResults, selectedPlaylist, setSelectedPlaylist, setActiveTab }) {
  const { 
    playTrack, addToQueue, currentTrack,
    eqEnabled, eqPreset, eqGains, setEqEnabled, setEqPreset, updateEqGain,
    audioFade, setAudioFade, history
  } = usePlayerStore();
  const { 
    activeTheme, themes, setTheme, setCustomAccent, customAccent, 
    isLightMode, toggleDayNight, glassmorphism, toggleGlass,
    layoutSkin, setLayoutSkin, activeExtensions, toggleExtension
  } = useThemeStore();
  
  const { likedSongs, likeSong, hiddenSongs, hideSong } = useAuthStore();
  const { partyId, isHost, membersCount, createParty, joinParty, leaveParty, error: partyError, isConnecting } = usePartyStore();
  
  const [trending, setTrending] = useState([]);
  const [addedTracker, setAddedTracker] = useState({});
  const [settingsCategory, setSettingsCategory] = useState('all');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [hwAccel, setHwAccel] = useState(true);
  const [partyInput, setPartyInput] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y, track }

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleTrackContextMenu = (e, track) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track
    });
  };

  useEffect(() => {
    if (window.electron) {
      window.electron.getSetting('hwAccel', true).then(setHwAccel);
    }
  }, []);

  // Fetch trending list on mount
  useEffect(() => {
    async function loadTrending() {
      const data = await youtubeService.getTrending();
      setTrending(data);
    }
    loadTrending();
  }, []);

  // Compute greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Buenos Días';
    if (hrs < 18) return 'Buenas Tardes';
    return 'Buenas Noches';
  };

  const handleQueueAdd = (track) => {
    addToQueue(track);
    setAddedTracker(prev => ({ ...prev, [track.id]: true }));
    setTimeout(() => {
      setAddedTracker(prev => ({ ...prev, [track.id]: false }));
    }, 1500);
  };

  const isLiked = (trackId) => likedSongs.some(s => s.id === trackId);
  const isHidden = (trackId) => hiddenSongs.includes(trackId);

  // Dynamic style tokens based on Day/Night Mode
  const bgClass = isLightMode ? 'bg-[#f4f4f7] text-[#121212]' : 'bg-darkbg text-brightwhite';
  const textPrimaryClass = isLightMode ? 'text-black font-semibold' : 'text-brightwhite font-medium';
  const textSecondaryClass = isLightMode ? 'text-gray-500' : 'text-lightgray';
  const borderClass = isLightMode ? 'border-gray-200' : 'border-white/5';
  const cardBgClass = isLightMode ? 'bg-white shadow-sm border border-gray-200' : 'premium-card-gradient border border-white/5';
  const hoverBgClass = isLightMode ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.03]';

  return (
    <div className={`flex-1 overflow-y-auto px-8 py-6 custom-scrollbar select-none transition-colors duration-500 ${bgClass}`}>
      
      {/* 1. SEARCH RESULTS VIEW */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimaryClass}`}>
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span>Resultados de Búsqueda</span>
            </h2>
            <p className="text-[11px] opacity-60">Resultados obtenidos directamente desde servidores públicos</p>
          </div>

          {searchResults && searchResults.length > 0 ? (
            <div className="space-y-1.5">
              {searchResults.map((track, index) => {
                if (track.type === 'artist') {
                  return (
                    <div 
                      key={track.id + '-' + index}
                      className={`flex items-center justify-between p-3 rounded-xl border border-transparent transition-all group duration-300 cursor-pointer ${hoverBgClass}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold opacity-40 w-4 text-center">{index + 1}</span>
                        <img 
                          src={track.thumbnail} 
                          alt={track.title}
                          className="w-12 h-12 rounded-full object-cover border border-white/10 shadow"
                        />
                        <div className="flex flex-col truncate">
                          <span className={`text-sm font-extrabold truncate ${textPrimaryClass}`}>{track.title}</span>
                          <span className="text-[10px] opacity-60 uppercase tracking-widest text-green-500 font-bold">{track.artist}</span>
                        </div>
                      </div>
                      <button className={`px-4 py-1.5 rounded-full text-[10px] font-bold border border-white/20 transition-all hover:scale-105 ${textPrimaryClass}`}>
                        Ver Perfil
                      </button>
                    </div>
                  );
                }

                return (
                  <div 
                    key={track.id + '-' + index}
                    onClick={() => playTrack(track)}
                    onContextMenu={(e) => handleTrackContextMenu(e, track)}
                    className={`flex items-center justify-between p-3 rounded-xl border border-transparent transition-all group duration-300 cursor-pointer ${hoverBgClass}`}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span className="text-xs font-bold opacity-40 w-4 text-center group-hover:hidden">
                        {index + 1}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); playTrack(track); }}
                        className={`hidden group-hover:flex w-4 text-center items-center justify-center ${textPrimaryClass}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <img 
                        src={track.thumbnail} 
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover border border-white/5 shadow"
                      />

                      <div className="flex flex-col truncate">
                        <span className={`text-xs font-bold truncate ${
                          currentTrack?.id === track.id ? '' : textPrimaryClass
                        }`} style={currentTrack?.id === track.id ? { color: activeTheme.accent } : {}}>
                          {track.title}
                        </span>
                        <span className="text-[10px] opacity-60 truncate">{track.artist}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] opacity-60 tabular-nums">
                        {track.duration}
                      </span>

                      {/* Heart Like */}
                      <button
                        onClick={(e) => { e.stopPropagation(); likeSong(track); }}
                        className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/5 transition-all`}
                      >
                        <Heart 
                          className={`w-3.5 h-3.5 ${isLiked(track.id) ? 'text-red-500 fill-red-500 opacity-100' : ''}`} 
                        />
                      </button>

                      {/* Queue Add */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQueueAdd(track); }}
                        className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/5 transition-all`}
                      >
                        {addedTracker[track.id] ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-1.5">
              <Music className="w-8 h-8" />
              <span className="text-xs">No hay resultados de búsqueda para mostrar</span>
              <span className="text-[10px] opacity-60">Escribe algo en la barra superior para buscar</span>
            </div>
          )}
        </div>
      )}

      {/* 2. PLAYLIST VIEW */}
      {activeTab === 'playlist' && selectedPlaylist && (
        <div className="space-y-6">
          {/* Header Billboard */}
          <div className={`flex flex-col md:flex-row items-end gap-6 pb-6 border-b ${borderClass}`}>
            <img 
              src={selectedPlaylist.thumbnail} 
              alt={selectedPlaylist.title}
              className="w-36 h-36 rounded-2xl object-cover shadow-premium border border-white/5"
            />
            <div className="flex-1 space-y-1.5">
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-white/5 border border-white/5 inline-block">
                Carpeta de Playlist
              </span>
              <h1 className={`text-2xl font-extrabold leading-none ${textPrimaryClass}`}>{selectedPlaylist.title}</h1>
              <p className="text-xs opacity-70 leading-relaxed max-w-xl">{selectedPlaylist.description}</p>
              <div className="text-[10px] opacity-60 flex items-center gap-1.5 pt-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{selectedPlaylist.tracks.length} canciones sincronizadas</span>
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <div className="space-y-1.5">
            {selectedPlaylist.tracks.map((track, idx) => (
              <div 
                key={track.id + '-' + idx}
                onClick={() => playTrack(track)}
                onContextMenu={(e) => handleTrackContextMenu(e, track)}
                className={`flex items-center justify-between p-3 rounded-xl border border-transparent transition-all group duration-300 cursor-pointer ${hoverBgClass}`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <span className="text-xs font-bold opacity-40 w-4 text-center group-hover:hidden">
                    {idx + 1}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); playTrack(track); }}
                    className={`hidden group-hover:flex w-4 text-center items-center justify-center ${textPrimaryClass}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <img 
                    src={track.thumbnail} 
                    alt={track.title}
                    className="w-9 h-9 rounded-lg object-cover border border-white/5 shadow"
                  />

                  <div className="flex flex-col truncate">
                    <span className={`text-xs font-semibold truncate ${
                      currentTrack?.id === track.id ? '' : textPrimaryClass
                    }`} style={currentTrack?.id === track.id ? { color: activeTheme.accent } : {}}>
                      {track.title}
                    </span>
                    <span className="text-[10px] opacity-60 truncate">{track.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] opacity-60 tabular-nums">
                    {track.duration}
                  </span>

                  <button
                    onClick={(e) => { e.stopPropagation(); likeSong(track); }}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/5 transition-all"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 ${isLiked(track.id) ? 'text-red-500 fill-red-500 opacity-100' : ''}`} 
                    />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleQueueAdd(track); }}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/5 transition-all"
                  >
                    {addedTracker[track.id] ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); hideSong(track.id); }}
                    title="No mostrar más"
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-red-500 hover:bg-white/5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. HOME DASHBOARD VIEW */}
      {activeTab === 'home' && (
        <div className="space-y-8">
          {/* Greeting Hero */}
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight leading-none mb-1 ${textPrimaryClass}`}>
              {getGreeting()}
            </h1>
            <p className="text-[11px] opacity-60">Tu espacio de reproducción ultra-optimizado y libre de anuncios</p>
          </div>

          {/* Dynamic Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mini IA DJ */}
            <div 
              className={`relative overflow-hidden rounded-3xl p-6 ${cardBgClass} border border-white/5 shadow-2xl flex flex-col items-start justify-between min-h-[200px] group cursor-pointer hover-glow`}
              onClick={async () => {
                if (window.djLoading) return;
                window.djLoading = true;
                usePartyStore.getState().showToast('IA DJ: Generando mix para ti...');
                try {
                  const topArtists = [...new Set(history.map(t => t.artist))].filter(Boolean).slice(0, 3);
                  const query = topArtists.length > 0 ? topArtists.join(' ') + ' mix' : 'lofi mix';
                  const results = await youtubeService.search(query);
                  const validTracks = results.filter(t => !isHidden(t.id));
                  if (validTracks.length > 0) {
                    playTrack(validTracks[0]);
                    usePlayerStore.setState({ queue: validTracks.slice(1) });
                  }
                } catch(e) {}
                window.djLoading = false;
              }}
            >
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700 pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-lg ${textPrimaryClass}`}>Mini IA DJ</h3>
                  <p className="text-xs opacity-60">Creará una cola infinita según lo que escuchas</p>
                </div>
              </div>

              <button className="mt-6 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generar Mix Inteligente</span>
              </button>
            </div>

            {/* Mix Automático */}
            <div 
              className={`relative overflow-hidden rounded-3xl p-6 ${cardBgClass} border border-white/5 shadow-2xl flex flex-col items-start justify-between min-h-[200px] group cursor-pointer hover-glow`}
              onClick={async () => {
                try {
                  usePartyStore.getState().showToast('Cargando Mix Diario...');
                  const results = await youtubeService.search('daily mix');
                  const validTracks = results.filter(t => !isHidden(t.id));
                  if (validTracks.length > 0) {
                    playTrack(validTracks[0]);
                    usePlayerStore.setState({ queue: validTracks.slice(1) });
                  }
                } catch(e) {}
              }}
            >
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-700 pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Flame className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-lg ${textPrimaryClass}`}>Mix para Ti</h3>
                  <p className="text-xs opacity-60">Basado en tus gustos generales</p>
                </div>
              </div>

              <div className="mt-6 flex -space-x-3">
                {history.filter(t => t.thumbnail && !isHidden(t.id)).slice(0, 4).map((t, i) => (
                  <img key={i} src={t.thumbnail} className="w-10 h-10 rounded-full border-2 border-[#121215] object-cover" />
                ))}
              </div>
            </div>
          </div>

          {/* Tus Más Escuchados */}
          {history.length > 0 && (
            <div className="space-y-3.5 mt-8">
              <div className="flex items-center justify-between pr-2">
                <span className={`text-sm font-extrabold tracking-tight uppercase flex items-center gap-2 ${textPrimaryClass}`}>
                  <Clock className="w-4.5 h-4.5" style={{ color: activeTheme.accent }} />
                  <span>Tus Más Escuchados</span>
                </span>
                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Basado en tu historial</span>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {/* Deduplicate and filter history */}
                {[...new Map(history.filter(t => !isHidden(t.id)).map(item => [item.id, item])).values()].slice(0, 10).map((song, i) => (
                  <div 
                    key={song.id + '-' + i}
                    onContextMenu={(e) => handleTrackContextMenu(e, song)}
                    className={`w-36 shrink-0 rounded-2xl p-3 space-y-3.5 group hover-glow hover:bg-white/[0.01] transition-all duration-300 select-none relative ${cardBgClass}`}
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow border border-white/5">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      <button
                        onClick={() => playTrack(song)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center text-black"
                          style={{ backgroundColor: activeTheme.accent }}
                        >
                          <Play className="w-5 h-5 fill-black text-black ml-0.5 shrink-0" />
                        </div>
                      </button>

                      {/* Right click mock to hide song */}
                      <button
                        onClick={(e) => { e.stopPropagation(); hideSong(song.id); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all text-white backdrop-blur-md"
                        title="No mostrar más"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      <h4 className={`text-xs font-bold truncate ${textPrimaryClass}`} title={song.title}>{song.title}</h4>
                      <p className="text-[9px] opacity-60 truncate">{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. LIBRARY SCREEN */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimaryClass}`}>
              <Library className="w-5 h-5" style={{ color: activeTheme.accent }} />
              <span>Mi Biblioteca</span>
            </h2>
            <p className="text-[11px] opacity-60">Tus favoritos y playlists creadas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Liked shelf widget */}
            <div 
              onClick={() => {
                const favorites = useAuthStore.getState().playlists.find(p => p.id === 'playlist-favorites');
                if (favorites) {
                  setSelectedPlaylist(favorites);
                  setActiveTab('playlist');
                }
              }}
              className={`${cardBgClass} rounded-2xl p-6 flex flex-col justify-between hover-glow transition-all duration-300 group cursor-pointer h-40`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/10 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Canciones Favoritas</h3>
                <span className="text-[10px] opacity-60">{likedSongs.length} temas guardados</span>
              </div>
            </div>

            {/* Sync Status Info widget */}
            <div className={`${cardBgClass} rounded-2xl p-6 flex flex-col justify-between h-40`}>
              <div className="w-10 h-10 rounded-xl bg-black/5 border border-white/5 flex items-center justify-center shrink-0">
                <Sparkle className="w-5 h-5 opacity-60" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Sincronización Local</h3>
                <span className="text-[10px] opacity-60">Configuraciones y caché de sesión almacenadas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.5. ARTISTS SCREEN */}
      {activeTab === 'artists' && (() => {
        const uniqueArtists = Array.from(new Set(likedSongs.map(s => s.artist)));
        return (
          <div className="space-y-6">
            <div>
              <h2 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimaryClass}`}>
                <Heart className="w-5 h-5" style={{ color: activeTheme.accent }} />
                <span>Tus Artistas Favoritos</span>
              </h2>
              <p className="text-[11px] opacity-60">Basado en tus canciones guardadas</p>
            </div>

            {uniqueArtists.length === 0 ? (
              <div className="text-center py-20 opacity-50 text-sm">
                Aún no has guardado canciones.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uniqueArtists.map(artist => (
                  <div key={artist} className={`p-4 rounded-xl ${cardBgClass} flex flex-col items-center gap-3 hover:scale-105 transition-transform duration-300 cursor-pointer`}>
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      <Music className="w-6 h-6 opacity-40" />
                    </div>
                    <span className={`text-xs font-bold text-center truncate w-full ${textPrimaryClass}`}>{artist}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* LISTEN TOGETHER SCREEN */}
      {activeTab === 'party' && (
        <div className="space-y-6 max-w-2xl mx-auto pt-10">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <h2 className={`text-2xl font-extrabold tracking-tight ${textPrimaryClass}`}>
              Listen Together
            </h2>
            <p className="text-xs opacity-60">Escucha música en tiempo real con tus amigos (hasta 8 personas)</p>
          </div>

          <div className={`p-8 rounded-3xl ${cardBgClass} border border-white/5 shadow-premium relative overflow-hidden`}>
            {partyId ? (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Sesión Activa</span>
                  <h3 className={`text-3xl font-black font-mono tracking-widest ${textPrimaryClass}`}>{partyId}</h3>
                </div>

                <div className="flex justify-center gap-4">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs opacity-60 block">Rol</span>
                    <span className={`text-sm font-bold ${textPrimaryClass}`}>{isHost ? 'Anfitrión (Host)' : 'Invitado'}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs opacity-60 block">Conectados</span>
                    <span className={`text-sm font-bold ${textPrimaryClass}`}>{membersCount} / 8</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => navigator.clipboard.writeText(partyId)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-xs border border-white/5 text-brightwhite"
                  >
                    <Copy className="w-4 h-4" /> Copiar Código
                  </button>
                  <button 
                    onClick={leaveParty}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all font-bold text-xs border border-red-500/10"
                  >
                    <LogOut className="w-4 h-4" /> Salir de la Sala
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {partyError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs text-center font-bold">
                    {partyError}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Join Card */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className={`text-sm font-bold ${textPrimaryClass}`}>Unirse a una sesión</h4>
                      <p className="text-[10px] opacity-60">Ingresa el código que te compartió tu amigo</p>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Ej: A8FX4B"
                        value={partyInput}
                        onChange={(e) => setPartyInput(e.target.value.toUpperCase())}
                        maxLength={6}
                        className={`w-full px-4 py-3 rounded-xl font-mono text-center tracking-widest outline-none border transition-all uppercase ${
                          isLightMode ? 'bg-black/5 border-black/10 focus:border-black/30' : 'bg-black/20 border-white/10 focus:border-white/30 text-brightwhite'
                        }`}
                      />
                      <button 
                        onClick={() => joinParty(partyInput)}
                        disabled={!partyInput.trim() || isConnecting}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                          !partyInput.trim() ? 'opacity-50 cursor-not-allowed bg-white/5' : 'bg-white/10 hover:bg-white/20 text-brightwhite'
                        }`}
                      >
                        {isConnecting ? 'Conectando...' : 'Entrar a la Sala'}
                      </button>
                    </div>
                  </div>

                  {/* Create Card */}
                  <div className="space-y-4 border-l border-white/10 pl-6 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className={`text-sm font-bold ${textPrimaryClass}`}>Ser Anfitrión</h4>
                      <p className="text-[10px] opacity-60">Crea una sala nueva y tú controlarás la música.</p>
                    </div>
                    <button 
                      onClick={createParty}
                      disabled={isConnecting}
                      className="w-full py-3 rounded-xl font-bold text-xs transition-all text-black hover:scale-105"
                      style={{ backgroundColor: activeTheme.accent }}
                    >
                      {isConnecting ? 'Creando...' : 'Crear Sala'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STORE / MARKETPLACE SCREEN */}
      {activeTab === 'store' && (
        <div className="space-y-8">
          {/* Marketplace Banner */}
          <div className="relative w-full h-48 rounded-3xl overflow-hidden shadow-premium flex items-center p-8 border border-white/10" style={{ background: `linear-gradient(135deg, ${activeTheme.accent}40, #000)` }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
            <div className="relative z-10 space-y-2">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest border border-white/10 backdrop-blur-md">Destacado</span>
              <h2 className={`text-4xl font-extrabold tracking-tight ${textPrimaryClass}`}>Spicetify UI Port</h2>
              <p className="text-sm opacity-80 max-w-md">Lleva la experiencia visual de Spotify al siguiente nivel con esta extensión premium portada directamente a Kero.</p>
              <button className="mt-4 px-6 py-2 rounded-full font-bold text-xs transition-all text-black hover:scale-105" style={{ backgroundColor: activeTheme.accent }}>
                Instalar Ahora
              </button>
            </div>
            <Store className="absolute -right-10 -bottom-10 w-64 h-64 opacity-10 text-white transform -rotate-12" />
          </div>

          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimaryClass}`}>
              <Sun className="w-5 h-5" style={{ color: activeTheme.accent }} />
              <span>Temas (Themes)</span>
            </h3>
            <button className="text-xs opacity-60 hover:opacity-100 uppercase tracking-widest font-bold">Ver todos</button>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { id: 'default', name: 'Kero Premium', desc: 'Tema por defecto oscuro mate', dev: 'Kero Team', color: '#ff0033' },
              { id: 'glassglow', name: 'Glassy Sunset', desc: 'Cristal translúcido y auroras cálidas', dev: 'Aura Studio', color: '#ff7700' }
            ].map(theme => (
              <div key={theme.id} className={`group ${cardBgClass} rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-premium`}>
                <div className="h-32 w-full flex items-center justify-center relative" style={{ background: `linear-gradient(to bottom right, ${theme.color}40, #111)` }}>
                  <Sun className="w-10 h-10 opacity-30" style={{ color: theme.color }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={() => setLayoutSkin(theme.id)}
                      className="px-6 py-2 rounded-full font-bold text-xs bg-white text-black hover:scale-105 transition-transform"
                    >
                      {layoutSkin === theme.id ? 'Aplicado' : 'Aplicar'}
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className={`text-sm font-bold truncate ${textPrimaryClass}`}>{theme.name}</h4>
                  <p className="text-[10px] opacity-60 truncate">{theme.desc}</p>
                  <p className="text-[9px] opacity-40 uppercase tracking-widest mt-2">{theme.dev}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <h3 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimaryClass}`}>
              <Zap className="w-5 h-5" style={{ color: activeTheme.accent }} />
              <span>Extensiones</span>
            </h3>
          </div>

          {/* Extensions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'visualizer-3d', name: 'Visualizador 3D Real', desc: 'Espectro de barras animado reactivo a audio', ver: 'v1.0.0' },
              { id: 'hifi-dac', name: 'Filtro DSP Hi-Fi DAC', desc: 'Mejora graves y agudos dinámicos en tiempo real', ver: 'v1.1.2' },
              { id: 'sleep-timer', name: 'Temporizador de Apagado', desc: 'Pausa la música automáticamente tras un temporizador', ver: 'v1.0.0' },
              { id: 'neko-cat', name: 'Neko Mascot (Mascota)', desc: 'Un tierno gatito animado que sigue tu puntero', ver: 'v1.0.0' }
            ].map(ext => {
              const isActive = activeExtensions.includes(ext.id);
              return (
                <div key={ext.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${cardBgClass} hover:border-white/20 hover:bg-white/[0.02]`}>
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 opacity-50" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${textPrimaryClass}`}>{ext.name}</p>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 opacity-50">{ext.ver}</span>
                      </div>
                      <p className="text-[10px] opacity-60 truncate">{ext.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleExtension(ext.id)}
                    className={`shrink-0 text-xs px-4 py-2 rounded-full font-bold transition-all border ${
                      isActive
                        ? 'bg-white/10 border-transparent text-white' 
                        : 'border-white/10 hover:border-white/30 hover:bg-white/5 text-brightwhite'
                    }`}
                  >
                    {isActive ? 'Eliminar' : 'Instalar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. SETTINGS SCREEN - GORGEOUS CUSTOMIZATION DASHBOARD */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimaryClass}`}>
                <Sliders className="w-5 h-5" style={{ color: activeTheme.accent }} />
                <span>Ajustes</span>
              </h2>
              <p className="text-[11px] opacity-60">Personaliza la estética visual y los controles de tu reproductor</p>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar ajustes..."
                value={settingsSearch}
                onChange={(e) => setSettingsSearch(e.target.value.toLowerCase())}
                className={`w-64 px-4 py-2 pl-9 rounded-xl text-xs font-medium outline-none transition-all ${
                  isLightMode ? 'bg-black/5 text-black placeholder:text-gray-500' : 'bg-white/5 text-brightwhite placeholder:text-gray-400 focus:bg-white/10'
                }`}
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            </div>
          </div>

          <div className="flex gap-2 pb-2 border-b border-white/5 overflow-x-auto">
            {['all', 'profile', 'visual', 'audio', 'system'].map(cat => (
              <button
                key={cat}
                onClick={() => setSettingsCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  settingsCategory === cat 
                    ? 'bg-white/10 text-brightwhite border border-white/10 shadow' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat === 'profile' ? 'Perfil' : cat === 'visual' ? 'Visual' : cat === 'audio' ? 'Audio DSP' : 'Sistema'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Profile & Account Card */}
            {(settingsCategory === 'all' || settingsCategory === 'profile') && (!settingsSearch || 'perfil nombre usuario cuenta cuenta de kero'.includes(settingsSearch)) && (
              <div className={`p-6 rounded-2xl ${cardBgClass} space-y-6 shadow-premium`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/15 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Perfil y Conexión</h3>
                    <p className="text-[10px] opacity-50">Gestiona tu identidad en Listen Together</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-white/5">
                  <div className="flex flex-col gap-0.5 flex-1 mr-4">
                    <span className="text-xs font-bold text-brightwhite">Nombre de Usuario</span>
                    <span className="text-[9px] opacity-50">Este nombre será visible para tus amigos en las salas</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Escribe tu nombre..."
                    defaultValue={useAuthStore.getState().username}
                    onBlur={(e) => useAuthStore.getState().setUsername(e.target.value || 'Guest')}
                    maxLength={15}
                    className={`w-36 px-3 py-2 rounded-lg text-xs font-bold outline-none text-center transition-all ${
                      isLightMode ? 'bg-black/5 text-black' : 'bg-white/10 text-white'
                    }`}
                  />
                </div>
              </div>
            )}
            
            {/* Aspect & Design Card */}
            {(settingsCategory === 'all' || settingsCategory === 'visual') && (!settingsSearch || 'modo tema desenfoques glassmorphism colores acento'.includes(settingsSearch)) && (
              <div className={`p-6 rounded-2xl ${cardBgClass} space-y-6 shadow-premium`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/15 rounded-lg">
                    <Sparkle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Personalización Visual</h3>
                    <p className="text-[10px] opacity-50">Configura la interfaz gráfica en tiempo real</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-white/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-brightwhite flex items-center gap-1.5">
                      {isLightMode ? <Sun className="w-3.5 h-3.5 text-yellow-500" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                      <span>Modo de Tema</span>
                    </span>
                    <span className="text-[9px] opacity-50">Alterna entre tema Día y Noche (Oscuro)</span>
                  </div>
                  <button onClick={toggleDayNight} className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 active:scale-95 text-brightwhite">
                    {isLightMode ? 'Noche' : 'Día'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-white/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-brightwhite">Desenfoques (Glassmorphism)</span>
                    <span className="text-[9px] opacity-50">Activa efectos traslúcidos en paneles</span>
                  </div>
                  <button onClick={toggleGlass} className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${glassmorphism ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${glassmorphism ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Custom Accent Color Palette Card */}
            <div className={`p-6 rounded-2xl ${cardBgClass} space-y-6 shadow-premium`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/15 rounded-lg">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Colores de Acento</h3>
                  <p className="text-[10px] opacity-50">Elige o diseña el color principal del sistema</p>
                </div>
              </div>

              {/* Predefined circular buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Acentos del Sistema</span>
                <div className="flex gap-3">
                  {Object.keys(themes).map((key) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      title={themes[key].name}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${
                        activeTheme.accent === themes[key].accent 
                          ? 'border-brightwhite scale-110' 
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: themes[key].accent,
                        boxShadow: activeTheme.accent === themes[key].accent ? `0 0 10px ${themes[key].accent}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Custom hex Color Picker input */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-white/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-brightwhite">Personalizar Acento</span>
                  <span className="text-[9px] opacity-50">Elige cualquier color personalizado</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tabular-nums text-brightwhite bg-white/5 px-2.5 py-1 rounded border border-white/10 uppercase">
                    {customAccent}
                  </span>
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="w-10 h-10 border-0 rounded-xl cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Kero Marketplace / Themes panel */}
            <div className={`p-6 rounded-2xl ${cardBgClass} space-y-6 shadow-premium lg:col-span-2`}>
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${activeTheme.accent}20` }}>
                  <Store className="w-5 h-5" style={{ color: activeTheme.accent }} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Tienda de Temas & Extensiones</h3>
                  <p className="text-[10px] opacity-50">Kero Marketplace (Estilo Spicetify)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Themes Section */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" /> Entornos Visuales
                  </span>
                  
                  <div className="space-y-2">
                    <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      layoutSkin === 'default' ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'
                    }`}>
                      <div>
                        <p className={`text-sm font-semibold ${textPrimaryClass}`}>Kero Premium (Default)</p>
                        <p className="text-[10px] opacity-50">Diseño oscuro mate y minimalista</p>
                      </div>
                      <button 
                        onClick={() => setLayoutSkin('default')}
                        className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all ${
                          layoutSkin === 'default' 
                            ? 'bg-white/10 text-white cursor-default'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        style={layoutSkin === 'default' ? { backgroundColor: activeTheme.accent, color: 'black' } : {}}
                      >
                        {layoutSkin === 'default' ? 'Activo' : 'Aplicar'}
                      </button>
                    </div>

                    <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      layoutSkin === 'glassglow' ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'
                    }`}>
                      <div>
                        <p className={`text-sm font-semibold ${textPrimaryClass}`}>Glassy Sunset</p>
                        <p className="text-[10px] opacity-50">Efecto cristal translúcido con auroras cálidas</p>
                      </div>
                      <button 
                        onClick={() => setLayoutSkin('glassglow')}
                        className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all ${
                          layoutSkin === 'glassglow' 
                            ? 'bg-white/10 text-white cursor-default'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        style={layoutSkin === 'glassglow' ? { backgroundColor: activeTheme.accent, color: 'black' } : {}}
                      >
                        {layoutSkin === 'glassglow' ? 'Activo' : 'Aplicar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extensions Section */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Extensiones Pro
                  </span>
                  
                  <div className="space-y-2">
                    {[
                      { id: 'visualizer-3d', name: 'Visualizador 3D Real', desc: 'Espectro animado reactivo a audio' },
                      { id: 'hifi-dac', name: 'Filtro DSP Hi-Fi DAC', desc: 'Mejora graves y agudos en tiempo real' },
                      { id: 'sleep-timer', name: 'Temporizador de Apagado', desc: 'Pausa tras cuenta regresiva' }
                    ].map(ext => {
                      const isActive = activeExtensions.includes(ext.id);
                      return (
                        <div key={ext.id} className="p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${textPrimaryClass}`}>{ext.name}</p>
                            <p className="text-[10px] opacity-50">{ext.desc}</p>
                          </div>
                          <button 
                            onClick={() => toggleExtension(ext.id)}
                            className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all border ${
                              isActive
                                ? 'bg-white/10 border-white/20' 
                                : 'border-white/10 hover:bg-white/5'
                            }`}
                          >
                            {isActive ? 'Activado' : 'Añadir'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Equalizer panel (7-band professional setup) */}
            {(settingsCategory === 'all' || settingsCategory === 'audio') && (!settingsSearch || 'audio ecualizador graves agudos dsp'.includes(settingsSearch)) && (
            <div className={`p-6 rounded-2xl ${cardBgClass} space-y-6 shadow-premium lg:col-span-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/15 rounded-lg">
                    <Sliders className="w-5 h-5" style={{ color: activeTheme.accent }} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Ecualizador de Audio Gráfico (DSP)</h3>
                    <p className="text-[10px] opacity-50">Modula las frecuencias del espectro con curvas interactivas</p>
                  </div>
                </div>
                
                {/* EQ master toggle */}
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${eqEnabled ? 'text-green-400' : 'opacity-40'}`}>
                    {eqEnabled ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => setEqEnabled(!eqEnabled)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                      eqEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        eqEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Preset Selector and preset chips */}
              <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-black/5 border border-white/5">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mr-2">Preajustes:</span>
                {[
                  { id: 'flat', name: 'Plano' },
                  { id: 'bass', name: 'Refuerzo de Graves' },
                  { id: 'vocal', name: 'Refuerzo de Voz' },
                  { id: 'electronic', name: 'Electrónica' },
                  { id: 'classical', name: 'Clásica' },
                  { id: 'jazz', name: 'Jazz' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    disabled={!eqEnabled}
                    onClick={() => setEqPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      !eqEnabled 
                        ? 'opacity-30 cursor-not-allowed'
                        : eqPreset === preset.id
                          ? 'bg-white/10 text-brightwhite border-white/20 shadow-md'
                          : 'bg-transparent text-lightgray border-transparent hover:bg-white/5 hover:text-brightwhite'
                    }`}
                    style={eqPreset === preset.id && eqEnabled ? { borderColor: activeTheme.accent, color: activeTheme.accent } : {}}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* SVG Spline Parametric Graphic EQ (Spotify Style) */}
              <div className="pt-4">
                <GraphicEQ />
              </div>
            </div>
            )}

            {/* System Options Card */}
            {(settingsCategory === 'all' || settingsCategory === 'system') && (!settingsSearch || 'sistema reproduccion animacion aceleracion hardware rendimiento'.includes(settingsSearch)) && (
              <div className={`p-6 rounded-2xl ${cardBgClass} space-y-6 shadow-premium`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/15 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${textPrimaryClass}`}>Sistema & Rendimiento</h3>
                    <p className="text-[10px] opacity-50">Opciones avanzadas del motor y reproducción</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-white/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-brightwhite">Animación de Audio (Fade)</span>
                    <span className="text-[9px] opacity-50">Desvanecimiento gradual al pausar/reproducir</span>
                  </div>
                  <button onClick={() => setAudioFade(!audioFade)} className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${audioFade ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${audioFade ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-white/5 relative">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-brightwhite">Aceleración por Hardware</span>
                    <span className="text-[9px] opacity-50">Mejora el rendimiento visual usando la GPU (Requiere reinicio)</span>
                  </div>
                  <button 
                    onClick={() => {
                      const nextVal = !hwAccel;
                      setHwAccel(nextVal);
                      if (window.electron) {
                        window.electron.setSetting('hwAccel', nextVal);
                        setTimeout(() => window.electron.relaunch(), 500); // Restart app
                      }
                    }} 
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${hwAccel ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${hwAccel ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
