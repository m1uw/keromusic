import React, { useState } from 'react';
import { Home, Search, Library, Music, LogIn, LogOut, ShieldCheck, Heart, Plus, Settings, Pin, Edit3, Trash, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Sidebar({ activeTab, setActiveTab, onSelectPlaylist, onOpenPlaylistModal }) {
  const { user, playlists, login, logout, isLoading, renamePlaylist, deletePlaylist, togglePinPlaylist } = useAuthStore();
  const { activeTheme, glassmorphism, isLightMode } = useThemeStore();
  
  // Custom right-click menu states
  const [contextMenu, setContextMenu] = useState(null); // { x, y, playlistId, isPinned }
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNav = (tab) => {
    setActiveTab(tab);
    usePlayerStore.setState({ showLyrics: false, showVisualizer: false, showQueue: false });
  };

  // Sort playlists: Pinned ones go first, then non-pinned
  const sortedPlaylists = [...playlists].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Dynamic style tokens based on Day/Night Mode
  const borderClass = isLightMode ? 'border-gray-200' : 'border-borderbg';
  const textPrimaryClass = isLightMode ? 'text-black' : 'text-brightwhite';
  const textSecondaryClass = isLightMode ? 'text-gray-500 hover:text-black' : 'text-lightgray hover:text-brightwhite';
  const dividerClass = isLightMode ? 'bg-gray-200' : 'bg-borderbg';
  const accountBgClass = isLightMode ? 'bg-black/[0.03] border border-gray-200' : 'bg-white/[0.03] border border-white/5';

  const sidebarBg = isLightMode
    ? (glassmorphism ? 'bg-white/85 backdrop-blur-md border-r border-gray-200' : 'bg-white border-r border-gray-200')
    : (glassmorphism ? 'glass-panel' : 'bg-panelbg border-r border-borderbg');

  const getNavItemClass = (tab) => {
    if (activeTab === tab) {
      return isLightMode
        ? 'text-black bg-black/[0.04] font-semibold'
        : 'text-brightwhite bg-white/5 font-semibold';
    }
    return isLightMode
      ? 'text-gray-500 hover:text-black hover:bg-black/[0.03]'
      : 'text-lightgray hover:text-brightwhite hover:bg-white/5';
  };

  const handlePlaylistRightClick = (e, playlist) => {
    e.preventDefault();
    // Position menu at cursor coordinates
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      playlistId: playlist.id,
      isPinned: playlist.isPinned || false
    });
  };

  const handleRenameSubmit = (id) => {
    if (renameValue.trim()) {
      renamePlaylist(id, renameValue.trim());
    }
    setRenameId(null);
  };

  return (
    <aside className={`w-64 flex flex-col select-none h-full transition-colors duration-500 relative ${sidebarBg}`}>
      
      {/* App Branding - Clean Kero text */}
      <div className="p-6 pb-2">
        <span className={`font-extrabold text-2xl tracking-wider flex items-center transition-colors duration-500 ${textPrimaryClass}`}>
          Kero
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="p-4 space-y-1">
        <button
          onClick={() => handleNav('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getNavItemClass('home')}`}
          style={activeTab === 'home' ? { borderLeft: `3px solid ${activeTheme.accent}` } : {}}
        >
          <Home className="w-5 h-5" style={activeTab === 'home' ? { color: activeTheme.accent } : {}} />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => handleNav('search')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getNavItemClass('search')}`}
          style={activeTab === 'search' ? { borderLeft: `3px solid ${activeTheme.accent}` } : {}}
        >
          <Search className="w-5 h-5" style={activeTab === 'search' ? { color: activeTheme.accent } : {}} />
          <span>Buscar</span>
        </button>

        <button
          onClick={() => handleNav('library')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getNavItemClass('library')}`}
          style={activeTab === 'library' ? { borderLeft: `3px solid ${activeTheme.accent}` } : {}}
        >
          <Library className="w-5 h-5" style={activeTab === 'library' ? { color: activeTheme.accent } : {}} />
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => handleNav('artists')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getNavItemClass('artists')}`}
          style={activeTab === 'artists' ? { borderLeft: `3px solid ${activeTheme.accent}` } : {}}
        >
          <Users className="w-5 h-5" style={activeTab === 'artists' ? { color: activeTheme.accent } : {}} />
          <span>Artistas</span>
        </button>
        <button
          onClick={() => handleNav('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getNavItemClass('settings')}`}
          style={activeTab === 'settings' ? { borderLeft: `3px solid ${activeTheme.accent}` } : {}}
        >
          <Settings className="w-5 h-5" style={activeTab === 'settings' ? { color: activeTheme.accent } : {}} />
          <span>Ajustes</span>
        </button>
      </nav>

      {/* Playlist List Header with PLUS Action */}
      <div className="px-6 py-2 flex items-center justify-between">
        <div className="flex flex-col flex-1">
          <div className={`h-[1px] w-full mb-3 ${dividerClass}`} />
          <span className="text-[11px] font-bold opacity-50 tracking-wider uppercase">Mis Playlists</span>
        </div>
        <button
          onClick={onOpenPlaylistModal}
          title="Crear o Importar Playlist"
          className={`p-1 rounded transition-all ml-2 ${isLightMode ? 'text-gray-500 hover:text-black hover:bg-black/[0.04]' : 'text-lightgray hover:text-brightwhite hover:bg-white/5'}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Playlists Items */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
        {sortedPlaylists.map((playlist) => {
          const isSelected = activeTab === 'playlist' && playlist.id === renameId;
          const isFavorite = playlist.id === 'playlist-favorites';
          const isCurated = playlist.id.startsWith('playlist-lofi') || playlist.id.startsWith('playlist-synth') || playlist.id.startsWith('playlist-chill');

          return (
            <div key={playlist.id} className="relative group/row">
              {renameId === playlist.id ? (
                <div className="px-3 py-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(playlist.id);
                      if (e.key === 'Escape') setRenameId(null);
                    }}
                    onBlur={() => handleRenameSubmit(playlist.id)}
                    autoFocus
                    className={`w-full px-2 py-1 text-xs rounded border outline-none font-medium ${
                      isLightMode 
                        ? 'bg-black/[0.03] border-gray-300 text-black focus:border-black' 
                        : 'bg-white/[0.05] border-white/10 text-brightwhite focus:border-white/30'
                    }`}
                  />
                </div>
              ) : (
                <button
                  onClick={() => onSelectPlaylist(playlist)}
                  onContextMenu={(e) => handlePlaylistRightClick(e, playlist)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-xs font-medium transition-all duration-300 group truncate ${textSecondaryClass} ${isLightMode ? 'hover:bg-black/[0.03]' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {isFavorite ? (
                      <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0 group-hover:scale-110 transition-transform animate-pulse" />
                    ) : (
                      <Music className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                    <span className="truncate group-hover:translate-x-0.5 transition-transform flex-1">{playlist.title}</span>
                  </div>

                  {playlist.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-gray-500 shrink-0 rotate-45 transform ml-1" style={{ color: activeTheme.accent }} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating custom context menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div 
            className={`fixed z-50 min-w-[160px] p-1.5 rounded-xl border shadow-2xl ${
              isLightMode 
                ? 'bg-white/95 border-gray-200 text-black shadow-black/10' 
                : 'bg-[#121212]/95 border-white/5 text-brightwhite shadow-black/80'
            } backdrop-blur-md transition-all duration-200`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                togglePinPlaylist(contextMenu.playlistId);
                setContextMenu(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg text-left transition-all ${
                isLightMode ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{contextMenu.isPinned ? 'Desfijar Playlist' : 'Fijar al Inicio'}</span>
            </button>

            {/* Core systems like Favorites cannot be renamed/deleted */}
            {contextMenu.playlistId !== 'playlist-favorites' && (
              <>
                <button
                  onClick={() => {
                    const pl = playlists.find(p => p.id === contextMenu.playlistId);
                    if (pl) {
                      setRenameId(contextMenu.playlistId);
                      setRenameValue(pl.title);
                    }
                    setContextMenu(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg text-left transition-all ${
                    isLightMode ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Renombrar</span>
                </button>
                <div className={`h-[1px] my-1 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`} />
                <button
                  onClick={() => {
                    deletePlaylist(contextMenu.playlistId);
                    setContextMenu(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg text-left text-red-500 hover:bg-red-500/10 transition-all`}
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Google Library Sync Account Section */}
      <div className={`p-4 border-t ${borderClass}`}>
        {user ? (
          <div className={`flex items-center justify-between p-2.5 rounded-xl ${accountBgClass}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-white/10 shrink-0" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-black"
                  style={{ backgroundColor: activeTheme.accent }}
                >
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="flex flex-col truncate">
                <span className={`text-xs font-semibold truncate ${textPrimaryClass}`}>{user.name}</span>
                <span className="text-[9px] opacity-60 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-green-500 inline" /> Sincronizado
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Desconectar cuenta"
              className={`p-1.5 rounded-lg transition-all ${isLightMode ? 'text-gray-500 hover:text-red-500 hover:bg-black/[0.04]' : 'text-lightgray hover:text-red-500 hover:bg-white/5'}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] disabled:opacity-50 ${
              isLightMode 
                ? 'bg-black/5 border-black/10 hover:bg-black/10 text-black' 
                : 'bg-brightwhite/10 border-white/10 hover:bg-white/20 text-brightwhite'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Sincronizando...' : 'Sincronizar Google'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
