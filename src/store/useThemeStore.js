import { create } from 'zustand';

const THEMES = {
  youtube: {
    name: 'YouTube Red',
    accent: '#ff0033',
    accentHover: '#cc0029',
    glow: 'rgba(255, 0, 51, 0.4)',
  },
  spotify: {
    name: 'Spotify Green',
    accent: '#1db954',
    accentHover: '#179843',
    glow: 'rgba(29, 185, 84, 0.4)',
  },
  neon: {
    name: 'Cyber Neon',
    accent: '#00d2ff',
    accentHover: '#00a3cc',
    glow: 'rgba(0, 210, 255, 0.4)',
  },
  purple: {
    name: 'Deep Purple',
    accent: '#a855f7',
    accentHover: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.4)',
  }
};

export const useThemeStore = create((set, get) => ({
  activeThemeKey: 'youtube',
  themes: THEMES,
  activeTheme: THEMES.youtube,
  glassmorphism: true,
  isLightMode: false,
  customAccent: '#ff0033',
  layoutSkin: 'default', // 'default' | 'winamp'
  activeExtensions: [], // list of activated spicetify-like extensions

  setLayoutSkin: (skin) => {
    set({ layoutSkin: skin });
    if (window.electron) {
      window.electron.setSetting('layoutSkin', skin);
    }
  },

  toggleExtension: (extId) => set((state) => {
    const active = state.activeExtensions.includes(extId);
    const nextExts = active 
      ? state.activeExtensions.filter(id => id !== extId)
      : [...state.activeExtensions, extId];
      
    if (window.electron) {
      window.electron.setSetting('activeExtensions', nextExts);
    }
    return { activeExtensions: nextExts };
  }),

  setTheme: (key) => {
    if (THEMES[key]) {
      set({ activeThemeKey: key, activeTheme: THEMES[key] });
      if (window.electron) {
        window.electron.setSetting('theme', key);
      }
    }
  },

  setCustomAccent: (hex) => {
    const updatedTheme = {
      name: 'Custom',
      accent: hex,
      accentHover: hex,
      glow: hex + '66' // transparent glow
    };
    set({ activeThemeKey: 'custom', activeTheme: updatedTheme, customAccent: hex });
    if (window.electron) {
      window.electron.setSetting('customAccent', hex);
      window.electron.setSetting('theme', 'custom');
    }
  },

  toggleGlass: () => set((state) => {
    const nextVal = !state.glassmorphism;
    if (window.electron) {
      window.electron.setSetting('glassmorphism', nextVal);
    }
    return { glassmorphism: nextVal };
  }),

  toggleDayNight: () => set((state) => {
    const nextVal = !state.isLightMode;
    if (window.electron) {
      window.electron.setSetting('isLightMode', nextVal);
    }
    return { isLightMode: nextVal };
  }),

  // Initialize theme from local electron storage
  initTheme: async () => {
    if (window.electron) {
      const savedTheme = await window.electron.getSetting('theme', 'youtube');
      const savedGlass = await window.electron.getSetting('glassmorphism', true);
      const savedLight = await window.electron.getSetting('isLightMode', false);
      const savedCustomAccent = await window.electron.getSetting('customAccent', '#ff0033');
      const savedSkin = await window.electron.getSetting('layoutSkin', 'default');
      const savedExts = await window.electron.getSetting('activeExtensions', []);
      
      let finalTheme = THEMES[savedTheme];
      if (savedTheme === 'custom') {
        finalTheme = {
          name: 'Custom',
          accent: savedCustomAccent,
          accentHover: savedCustomAccent,
          glow: savedCustomAccent + '66'
        };
      }

      set({ 
        activeThemeKey: savedTheme, 
        activeTheme: finalTheme || THEMES.youtube,
        glassmorphism: savedGlass,
        isLightMode: savedLight,
        customAccent: savedCustomAccent,
        layoutSkin: savedSkin,
        activeExtensions: savedExts
      });
    }
  }
}));
