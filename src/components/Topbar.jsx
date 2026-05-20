import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Search, Maximize2, Minimize2, Tv, ShoppingCart, Users, User, LogIn, LogOut, Check } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export default function Topbar({ onSearch, activeTab, setActiveTab }) {
  const [query, setQuery] = useState('');
  const { activeTheme, isLightMode, glassmorphism } = useThemeStore();
  const { compactMode, setCompactMode } = usePlayerStore();
  const { user, username, profilePic, setUsername, setProfilePic, login, logout, saveProfileToCloud } = useAuthStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(username);

  const handleMinimize = () => window.electron?.minimize();
  const handleMaximize = () => window.electron?.maximize();
  const handleClose = () => window.electron?.close();

  const toggleCompact = () => {
    setCompactMode(!compactMode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setActiveTab('search');
    }
  };

  // Sync tab transitions to reset search query input if returning home
  useEffect(() => {
    if (activeTab === 'home') {
      setQuery('');
    }
  }, [activeTab]);

  const headerBgClass = isLightMode ? 'bg-white border-gray-200 text-black' : 'bg-darkbg border-borderbg text-brightwhite';
  const inputBgClass = isLightMode ? 'bg-[#f4f4f7] border-gray-300 text-black placeholder-gray-400 focus:border-gray-400' : 'bg-panelbg border-borderbg text-brightwhite placeholder-lightgray focus:border-white/20';
  const buttonHoverClass = isLightMode ? 'text-gray-600 hover:text-black hover:bg-black/[0.04]' : 'text-lightgray hover:text-brightwhite hover:bg-white/5';
  const borderDividerClass = isLightMode ? 'bg-gray-200' : 'bg-borderbg';

  return (
    <header className={`h-14 border-b flex items-center justify-between px-6 select-none titlebar-drag shrink-0 relative z-50 transition-colors duration-500 ${headerBgClass}`}>
      
      {/* Clickable Profile Avatar for Customization */}
      <div className="flex items-center gap-3 shrink-0 titlebar-nodrag cursor-pointer mr-6 hover:opacity-85 transition-opacity" onClick={() => setShowProfileModal(true)}>
        {profilePic ? (
          <img src={profilePic} className="w-9 h-9 rounded-full border border-white/10 object-cover shadow-md" />
        ) : (
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black shadow-md"
            style={{ backgroundColor: activeTheme.accent }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        {!compactMode && (
          <div className="flex flex-col text-left leading-tight">
            <span className={`text-xs font-extrabold tracking-tight ${isLightMode ? 'text-black' : 'text-brightwhite'}`}>{username}</span>
            <span className="text-[8px] opacity-40 uppercase tracking-widest font-bold">Personalizar</span>
          </div>
        )}
      </div>

      {/* Search Input Bar (only visible when not in compact mode) */}
      {!compactMode ? (
        <form onSubmit={handleSubmit} className="flex-1 max-w-sm titlebar-nodrag mr-auto">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 opacity-50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search music, playlists, artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full border rounded-full py-1.5 pl-10 pr-4 text-xs transition-all ${inputBgClass}`}
            />
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-1.5 mr-auto">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeTheme.accent }} />
          <span className="text-[9px] uppercase font-bold opacity-60 tracking-wider">Kero Mini</span>
        </div>
      )}

      {/* Frame Controls & Compact toggles */}
      <div className="flex items-center gap-1 titlebar-nodrag">
        {/* Store / Marketplace */}
        <button
          onClick={() => {
            if (setActiveTab) {
              setActiveTab('store');
              usePlayerStore.setState({ showLyrics: false, showVisualizer: false, showQueue: false });
            }
          }}
          title="Kero Marketplace"
          className={`p-1.5 rounded-lg transition-all ${buttonHoverClass}`}
        >
          <ShoppingCart className="w-4 h-4" style={activeTab === 'store' ? { color: activeTheme.accent } : {}} />
        </button>

        {/* Listen Together */}
        <button
          onClick={() => {
            if (setActiveTab) {
              setActiveTab('party');
              usePlayerStore.setState({ showLyrics: false, showVisualizer: false, showQueue: false });
            }
          }}
          title="Listen Together"
          className={`p-1.5 rounded-lg transition-all mr-2 ${buttonHoverClass}`}
        >
          <Users className="w-4 h-4" style={activeTab === 'party' ? { color: activeTheme.accent } : {}} />
        </button>

        {/* Compact Mode (Mini-Player) Button */}
        <button
          onClick={toggleCompact}
          title={compactMode ? "Open Dashboard" : "Mini-Player (PiP)"}
          className={`p-1.5 rounded-lg transition-all mr-2 ${buttonHoverClass}`}
        >
          <Tv className="w-4 h-4" style={compactMode ? { color: activeTheme.accent } : {}} />
        </button>

        <div className={`h-4 w-[1px] mr-2 ${borderDividerClass}`} />

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className={`p-1.5 rounded-lg transition-all ${buttonHoverClass}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize */}
        {!compactMode && (
          <button
            onClick={handleMaximize}
            className={`p-1.5 rounded-lg transition-all ${buttonHoverClass}`}
          >
            <Square className="w-3 h-3" />
          </button>
        )}

        {/* Close */}
        <button
          onClick={handleClose}
          className={`p-1.5 rounded-lg hover:text-red-500 transition-all ${
            isLightMode ? 'text-gray-600 hover:bg-red-500/10' : 'text-lightgray hover:bg-red-500/10'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Premium Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div 
            className={`w-full max-w-sm rounded-3xl p-6 border relative shadow-2xl flex flex-col items-center gap-6 animate-scale-up ${
              isLightMode ? 'bg-white border-gray-200 text-black' : 'bg-[#151518] border-white/5 text-brightwhite'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowProfileModal(false);
                setUsername(editName);
              }}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="text-center space-y-0.5">
              <h3 className="text-sm font-black uppercase tracking-wider">Personalizar Perfil</h3>
              <p className="text-[10px] opacity-60">Sincronizado en todos tus dispositivos</p>
            </div>

            {/* Clickable Image Avatar Upload */}
            <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
              {profilePic ? (
                <img src={profilePic} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-3xl font-black text-black"
                  style={{ backgroundColor: activeTheme.accent }}
                >
                  {editName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Overlay on hover */}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity duration-300 cursor-pointer">
                Cambiar Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProfilePic(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Username Input */}
            <div className="w-full space-y-1.5 text-left">
              <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider px-1">Tu Nombre de Usuario</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full border rounded-2xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-white/20 transition-all ${
                  isLightMode ? 'bg-[#f4f4f7] border-gray-300 text-black' : 'bg-white/5 border-white/5 text-white'
                }`}
              />
            </div>

            {/* Cloud Sync details */}
            <div className={`w-full p-3.5 rounded-2xl border text-center ${
              isLightMode ? 'bg-black/[0.02] border-gray-100' : 'bg-white/[0.02] border-white/5'
            }`}>
              {user ? (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-green-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Sincronizado con Google ({user.name})</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] opacity-60">Sincroniza tus Playlists y Perfil entre múltiples PCs en un clic</p>
                  <button 
                    onClick={login}
                    className="px-4 py-2 bg-white text-black font-bold text-[10px] rounded-full hover:bg-gray-100 transition-all shadow-md active:scale-95 flex items-center gap-1.5 mx-auto"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Conectar Google</span>
                  </button>
                </div>
              )}
            </div>

            {/* Save Profile Button */}
            <button
              onClick={() => {
                setUsername(editName);
                setShowProfileModal(false);
              }}
              className="w-full py-3 bg-white hover:bg-gray-100 text-black font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-white/5 active:scale-98"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
