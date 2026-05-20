import React, { useState } from 'react';
import { Heart, Plus, Trash2, Library, ChevronRight, Music } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore } from '../store/useThemeStore';

export default function ContextMenu({ x, y, track, onClose }) {
  const { likedSongs, likeSong, hideSong, playlists, addTrackToPlaylist } = useAuthStore();
  const { addToQueue } = usePlayerStore();
  const { isLightMode } = useThemeStore();
  const [showPlaylistsSubmenu, setShowPlaylistsSubmenu] = useState(false);

  const isLiked = likedSongs.some(s => s.id === track.id);
  const customPlaylists = playlists.filter(p => p.id.startsWith('playlist-custom-') || p.id.startsWith('playlist-imported-'));

  const handleAction = (callback) => {
    callback();
    onClose();
  };

  const bgClass = isLightMode ? 'bg-white border-gray-200 text-black shadow-lg' : 'bg-[#18181c]/95 border-white/5 text-brightwhite shadow-2xl';
  const itemHoverClass = isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/5';

  return (
    <div 
      className={`fixed z-[99999] w-52 py-1.5 rounded-xl border backdrop-blur-md text-xs font-semibold ${bgClass}`}
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={() => handleAction(() => addToQueue(track))}
        className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition-all ${itemHoverClass}`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Añadir a la cola</span>
      </button>

      <button 
        onClick={() => handleAction(() => likeSong(track))}
        className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition-all ${itemHoverClass}`}
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
        <span>{isLiked ? 'Eliminar de favoritos' : 'Añadir a favoritos'}</span>
      </button>

      <button 
        onClick={() => handleAction(() => hideSong(track.id))}
        className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition-all hover:text-red-400 ${itemHoverClass}`}
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
        <span>Ocultar canción</span>
      </button>

      <div 
        className="relative"
        onMouseEnter={() => setShowPlaylistsSubmenu(true)}
        onMouseLeave={() => setShowPlaylistsSubmenu(false)}
      >
        <button 
          className={`w-full px-4 py-2 text-left flex items-center justify-between transition-all ${itemHoverClass}`}
        >
          <div className="flex items-center gap-2.5">
            <Library className="w-3.5 h-3.5" />
            <span>Añadir a playlist</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        {showPlaylistsSubmenu && (
          <div 
            className={`absolute top-0 left-full w-48 py-1.5 rounded-xl border backdrop-blur-md text-xs font-semibold shadow-2xl ${bgClass}`}
            style={{ marginLeft: '1px' }}
          >
            {customPlaylists.length > 0 ? (
              customPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAction(() => addTrackToPlaylist(pl.id, track))}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition-all truncate ${itemHoverClass}`}
                >
                  <Music className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{pl.title}</span>
                </button>
              ))
            ) : (
              <span className="block px-4 py-2 text-left opacity-40 italic">Crea una playlist primero</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
