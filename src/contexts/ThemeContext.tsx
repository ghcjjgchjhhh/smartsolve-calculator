import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';
export type AccentCategory = 'greens' | 'blues' | 'purples' | 'warm' | 'neutrals';
export type AccentColorId =
  | 'emerald'
  | 'mint'
  | 'teal'
  | 'forest'
  | 'jade'
  | 'lime'
  | 'chartreuse'
  | 'cyan'
  | 'sky'
  | 'cobalt'
  | 'royal'
  | 'sapphire'
  | 'ice'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'plum'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'ruby'
  | 'crimson'
  | 'coral'
  | 'orange'
  | 'tangerine'
  | 'amber'
  | 'gold'
  | 'slate';

export interface AccentPalette {
  id: AccentColorId;
  name: string;
  tagline: string;
  category: AccentCategory;
  swatchClass: string;
  primary: string;
  primaryLightMode: string;
  hover: string;
  light: string;
  rgb: string;
  onSolid: string;
  softLight: string;
  softBorderLight: string;
  textOnLightSoft: string;
  softDark: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  // Greens & Teals (7)
  {
    id: 'emerald',
    name: 'Emerald',
    tagline: 'Precision STEM',
    category: 'greens',
    swatchClass: 'bg-green-500',
    primary: '#22C55E',
    primaryLightMode: '#15803D',
    hover: '#16A34A',
    light: '#4ADE80',
    rgb: '34, 197, 94',
    onSolid: '#FFFFFF',
    softLight: '#ECFDF5',
    softBorderLight: '#6EE7B7',
    textOnLightSoft: '#065F46',
    softDark: '#052E16',
  },
  {
    id: 'mint',
    name: 'Mint',
    tagline: 'Cool Biotech',
    category: 'greens',
    swatchClass: 'bg-teal-400',
    primary: '#10B981',
    primaryLightMode: '#047857',
    hover: '#059669',
    light: '#34D399',
    rgb: '16, 185, 129',
    onSolid: '#FFFFFF',
    softLight: '#ECFDF5',
    softBorderLight: '#6EE7B7',
    textOnLightSoft: '#065F46',
    softDark: '#042F2E',
  },
  {
    id: 'teal',
    name: 'Teal',
    tagline: 'Clinical Aqua',
    category: 'greens',
    swatchClass: 'bg-teal-500',
    primary: '#14B8A6',
    primaryLightMode: '#0F766E',
    hover: '#0D9488',
    light: '#2DD4BF',
    rgb: '20, 184, 166',
    onSolid: '#FFFFFF',
    softLight: '#F0FDFA',
    softBorderLight: '#5EEAD4',
    textOnLightSoft: '#115E59',
    softDark: '#042F2E',
  },
  {
    id: 'forest',
    name: 'Forest',
    tagline: 'Deep Botanical',
    category: 'greens',
    swatchClass: 'bg-green-700',
    primary: '#16A34A',
    primaryLightMode: '#166534',
    hover: '#15803D',
    light: '#22C55E',
    rgb: '22, 163, 74',
    onSolid: '#FFFFFF',
    softLight: '#F0FDF4',
    softBorderLight: '#86EFAC',
    textOnLightSoft: '#14532D',
    softDark: '#052E16',
  },
  {
    id: 'jade',
    name: 'Jade',
    tagline: 'Royal Mineral',
    category: 'greens',
    swatchClass: 'bg-green-600',
    primary: '#059669',
    primaryLightMode: '#065F46',
    hover: '#047857',
    light: '#10B981',
    rgb: '5, 150, 105',
    onSolid: '#FFFFFF',
    softLight: '#ECFDF5',
    softBorderLight: '#6EE7B7',
    textOnLightSoft: '#064E3B',
    softDark: '#022C22',
  },
  {
    id: 'lime',
    name: 'Lime',
    tagline: 'Tactical Pro',
    category: 'greens',
    swatchClass: 'bg-lime-500',
    primary: '#84CC16',
    primaryLightMode: '#4D7C0F',
    hover: '#65A30D',
    light: '#A3E635',
    rgb: '132, 204, 22',
    onSolid: '#09090B',
    softLight: '#F7FEE7',
    softBorderLight: '#BEF264',
    textOnLightSoft: '#3F6212',
    softDark: '#172604',
  },
  {
    id: 'chartreuse',
    name: 'Neon Lime',
    tagline: 'Electric Volt',
    category: 'greens',
    swatchClass: 'bg-lime-400',
    primary: '#A3E635',
    primaryLightMode: '#3F6212',
    hover: '#84CC16',
    light: '#BEF264',
    rgb: '163, 230, 53',
    onSolid: '#09090B',
    softLight: '#F7FEE7',
    softBorderLight: '#D9F99D',
    textOnLightSoft: '#365314',
    softDark: '#1A2E05',
  },

  // Blues & Cyans (6)
  {
    id: 'cyan',
    name: 'Cyan',
    tagline: 'Lab Instrument',
    category: 'blues',
    swatchClass: 'bg-cyan-500',
    primary: '#06B6D4',
    primaryLightMode: '#0E7490',
    hover: '#0891B2',
    light: '#22D3EE',
    rgb: '6, 182, 212',
    onSolid: '#FFFFFF',
    softLight: '#ECFEFF',
    softBorderLight: '#67E8F9',
    textOnLightSoft: '#155E75',
    softDark: '#06262E',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    tagline: 'Clear Horizon',
    category: 'blues',
    swatchClass: 'bg-sky-500',
    primary: '#0EA5E9',
    primaryLightMode: '#0369A1',
    hover: '#0284C7',
    light: '#38BDF8',
    rgb: '14, 165, 233',
    onSolid: '#FFFFFF',
    softLight: '#F0F9FF',
    softBorderLight: '#7DD3FC',
    textOnLightSoft: '#075985',
    softDark: '#082F49',
  },
  {
    id: 'ice',
    name: 'Ice Blue',
    tagline: 'Frosted Optic',
    category: 'blues',
    swatchClass: 'bg-sky-400',
    primary: '#38BDF8',
    primaryLightMode: '#0284C7',
    hover: '#0EA5E9',
    light: '#7DD3FC',
    rgb: '56, 189, 248',
    onSolid: '#09090B',
    softLight: '#F0F9FF',
    softBorderLight: '#BAE6FD',
    textOnLightSoft: '#0369A1',
    softDark: '#0C4A6E',
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    tagline: 'Academic Focus',
    category: 'blues',
    swatchClass: 'bg-blue-500',
    primary: '#3B82F6',
    primaryLightMode: '#1D4ED8',
    hover: '#2563EB',
    light: '#60A5FA',
    rgb: '59, 130, 246',
    onSolid: '#FFFFFF',
    softLight: '#EFF6FF',
    softBorderLight: '#93C5FD',
    textOnLightSoft: '#1E40AF',
    softDark: '#172554',
  },
  {
    id: 'royal',
    name: 'Royal Blue',
    tagline: 'Classic Study',
    category: 'blues',
    swatchClass: 'bg-blue-600',
    primary: '#2563EB',
    primaryLightMode: '#1E40AF',
    hover: '#1D4ED8',
    light: '#3B82F6',
    rgb: '37, 99, 235',
    onSolid: '#FFFFFF',
    softLight: '#EFF6FF',
    softBorderLight: '#93C5FD',
    textOnLightSoft: '#1E3A8A',
    softDark: '#172554',
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    tagline: 'Deep Ink',
    category: 'blues',
    swatchClass: 'bg-blue-700',
    primary: '#1D4ED8',
    primaryLightMode: '#1E3A8A',
    hover: '#1E40AF',
    light: '#60A5FA',
    rgb: '29, 78, 216',
    onSolid: '#FFFFFF',
    softLight: '#EFF6FF',
    softBorderLight: '#93C5FD',
    textOnLightSoft: '#1E3A8A',
    softDark: '#1E1B4B',
  },

  // Purples & Pinks (6)
  {
    id: 'indigo',
    name: 'Indigo',
    tagline: 'Midnight Logic',
    category: 'purples',
    swatchClass: 'bg-indigo-500',
    primary: '#6366F1',
    primaryLightMode: '#4338CA',
    hover: '#4F46E5',
    light: '#818CF8',
    rgb: '99, 102, 241',
    onSolid: '#FFFFFF',
    softLight: '#EEF2FF',
    softBorderLight: '#A5B4FC',
    textOnLightSoft: '#3730A3',
    softDark: '#1E1B4B',
  },
  {
    id: 'violet',
    name: 'Violet',
    tagline: 'AI Studio',
    category: 'purples',
    swatchClass: 'bg-violet-500',
    primary: '#8B5CF6',
    primaryLightMode: '#6D28D9',
    hover: '#7C3AED',
    light: '#A78BFA',
    rgb: '139, 92, 246',
    onSolid: '#FFFFFF',
    softLight: '#F5F3FF',
    softBorderLight: '#C4B5FD',
    textOnLightSoft: '#5B21B6',
    softDark: '#1E103C',
  },
  {
    id: 'purple',
    name: 'Purple',
    tagline: 'Quantum Glow',
    category: 'purples',
    swatchClass: 'bg-purple-500',
    primary: '#A855F7',
    primaryLightMode: '#7E22CE',
    hover: '#9333EA',
    light: '#C084FC',
    rgb: '168, 85, 247',
    onSolid: '#FFFFFF',
    softLight: '#FAF5FF',
    softBorderLight: '#D8B4FE',
    textOnLightSoft: '#6B21A8',
    softDark: '#2E1065',
  },
  {
    id: 'plum',
    name: 'Plum',
    tagline: 'Velvet Scholar',
    category: 'purples',
    swatchClass: 'bg-purple-700',
    primary: '#9333EA',
    primaryLightMode: '#6B21A8',
    hover: '#7E22CE',
    light: '#C084FC',
    rgb: '147, 51, 234',
    onSolid: '#FFFFFF',
    softLight: '#FAF5FF',
    softBorderLight: '#D8B4FE',
    textOnLightSoft: '#581C87',
    softDark: '#3B0764',
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    tagline: 'Neon Prism',
    category: 'purples',
    swatchClass: 'bg-fuchsia-500',
    primary: '#D946EF',
    primaryLightMode: '#A21CAF',
    hover: '#C026D3',
    light: '#E879F9',
    rgb: '217, 70, 239',
    onSolid: '#FFFFFF',
    softLight: '#FDF4FF',
    softBorderLight: '#F0ABFC',
    textOnLightSoft: '#86198F',
    softDark: '#4A044E',
  },
  {
    id: 'pink',
    name: 'Pink',
    tagline: 'Vibrant Studio',
    category: 'purples',
    swatchClass: 'bg-pink-500',
    primary: '#EC4899',
    primaryLightMode: '#BE185D',
    hover: '#DB2777',
    light: '#F472B6',
    rgb: '236, 72, 153',
    onSolid: '#FFFFFF',
    softLight: '#FDF2F8',
    softBorderLight: '#F9A8D4',
    textOnLightSoft: '#9D174D',
    softDark: '#500724',
  },

  // Reds & Oranges (6)
  {
    id: 'rose',
    name: 'Rose',
    tagline: 'Bio Crimson',
    category: 'warm',
    swatchClass: 'bg-rose-500',
    primary: '#F43F5E',
    primaryLightMode: '#BE123C',
    hover: '#E11D48',
    light: '#FB7185',
    rgb: '244, 63, 94',
    onSolid: '#FFFFFF',
    softLight: '#FFF1F2',
    softBorderLight: '#FDA4AF',
    textOnLightSoft: '#9F1239',
    softDark: '#2F0814',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    tagline: 'Deep Cardinal',
    category: 'warm',
    swatchClass: 'bg-rose-600',
    primary: '#E11D48',
    primaryLightMode: '#9F1239',
    hover: '#BE123C',
    light: '#FB7185',
    rgb: '225, 29, 72',
    onSolid: '#FFFFFF',
    softLight: '#FFF1F2',
    softBorderLight: '#FDA4AF',
    textOnLightSoft: '#881337',
    softDark: '#4C0519',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    tagline: 'Bold Exam',
    category: 'warm',
    swatchClass: 'bg-red-600',
    primary: '#EF4444',
    primaryLightMode: '#B91C1C',
    hover: '#DC2626',
    light: '#F87171',
    rgb: '239, 68, 68',
    onSolid: '#FFFFFF',
    softLight: '#FEF2F2',
    softBorderLight: '#FCA5A5',
    textOnLightSoft: '#991B1B',
    softDark: '#450A0A',
  },
  {
    id: 'coral',
    name: 'Coral',
    tagline: 'Soft Flamingo',
    category: 'warm',
    swatchClass: 'bg-rose-400',
    primary: '#FB7185',
    primaryLightMode: '#BE123C',
    hover: '#F43F5E',
    light: '#FDA4AF',
    rgb: '251, 113, 133',
    onSolid: '#09090B',
    softLight: '#FFF1F2',
    softBorderLight: '#FECDD3',
    textOnLightSoft: '#9F1239',
    softDark: '#4C0519',
  },
  {
    id: 'orange',
    name: 'Orange',
    tagline: 'Solar Action',
    category: 'warm',
    swatchClass: 'bg-orange-500',
    primary: '#F97316',
    primaryLightMode: '#C2410C',
    hover: '#EA580C',
    light: '#FB923C',
    rgb: '249, 115, 22',
    onSolid: '#FFFFFF',
    softLight: '#FFF7ED',
    softBorderLight: '#FDBA74',
    textOnLightSoft: '#9A3412',
    softDark: '#2F1205',
  },
  {
    id: 'tangerine',
    name: 'Tangerine',
    tagline: 'Classic Casio',
    category: 'warm',
    swatchClass: 'bg-orange-600',
    primary: '#EA580C',
    primaryLightMode: '#9A3412',
    hover: '#C2410C',
    light: '#FB923C',
    rgb: '234, 88, 12',
    onSolid: '#FFFFFF',
    softLight: '#FFF7ED',
    softBorderLight: '#FDBA74',
    textOnLightSoft: '#7C2D12',
    softDark: '#431407',
  },

  // Golds & Neutrals (3)
  {
    id: 'amber',
    name: 'Amber',
    tagline: 'Lab Gold',
    category: 'neutrals',
    swatchClass: 'bg-amber-500',
    primary: '#F59E0B',
    primaryLightMode: '#B45309',
    hover: '#D97706',
    light: '#FBBF24',
    rgb: '245, 158, 11',
    onSolid: '#09090B',
    softLight: '#FFFBEB',
    softBorderLight: '#FCD34D',
    textOnLightSoft: '#92400E',
    softDark: '#2E1A04',
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'Honor Medal',
    category: 'neutrals',
    swatchClass: 'bg-yellow-500',
    primary: '#EAB308',
    primaryLightMode: '#A16207',
    hover: '#CA8A04',
    light: '#FACC15',
    rgb: '234, 179, 8',
    onSolid: '#09090B',
    softLight: '#FEFCE8',
    softBorderLight: '#FDE047',
    textOnLightSoft: '#854D0E',
    softDark: '#422006',
  },
  {
    id: 'slate',
    name: 'Titanium',
    tagline: 'Monochrome Pro',
    category: 'neutrals',
    swatchClass: 'bg-slate-500',
    primary: '#64748B',
    primaryLightMode: '#334155',
    hover: '#475569',
    light: '#94A3B8',
    rgb: '100, 116, 139',
    onSolid: '#FFFFFF',
    softLight: '#F1F5F9',
    softBorderLight: '#CBD5E1',
    textOnLightSoft: '#1E293B',
    softDark: '#0F172A',
  },
];

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  cycleTheme: () => void;
  accentColor: AccentColorId;
  accentPalette: AccentPalette;
  setAccentColor: (accent: AccentColorId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'smartsolve_theme_preference';
const ACCENT_STORAGE_KEY = 'smartsolve_accent_color';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'system' || saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'system';
  });

  const [accentColor, setAccentColorState] = useState<AccentColorId>(() => {
    if (typeof window === 'undefined') return 'emerald';
    try {
      const saved = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColorId | null;
      if (saved && ACCENT_PALETTES.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'emerald';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateThemeMatch = (e: MediaQueryListEvent | MediaQueryList) => {
        setSystemIsDark(e.matches);
      };

      setSystemIsDark(mediaQuery.matches);

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', updateThemeMatch);
        return () => mediaQuery.removeEventListener('change', updateThemeMatch);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(updateThemeMatch);
        return () => (mediaQuery as any).removeListener(updateThemeMatch);
      }
    } catch {
      // ignore
    }
  }, []);

  const resolvedTheme: ResolvedTheme =
    themePreference === 'system' ? (systemIsDark ? 'dark' : 'light') : themePreference;

  const isDark = resolvedTheme === 'dark';
  const accentPalette = ACCENT_PALETTES.find((p) => p.id === accentColor) || ACCENT_PALETTES[0];

  // Apply theme + accent palette to document root, body, and mobile meta tags
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';

      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
        body.setAttribute('data-theme', 'dark');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';

      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
        body.setAttribute('data-theme', 'light');
      }
    }

    // Apply accent CSS custom properties and attribute
    root.setAttribute('data-accent', accentPalette.id);
    if (body) body.setAttribute('data-accent', accentPalette.id);

    root.style.setProperty('--accent-primary', accentPalette.primary);
    root.style.setProperty(
      '--accent-text',
      isDark ? accentPalette.primary : accentPalette.primaryLightMode
    );
    root.style.setProperty('--accent-hover', accentPalette.hover);
    root.style.setProperty('--accent-light', accentPalette.light);
    root.style.setProperty('--accent-rgb', accentPalette.rgb);
    root.style.setProperty('--accent-on-solid', accentPalette.onSolid);
    root.style.setProperty('--accent-soft-light', accentPalette.softLight);
    root.style.setProperty('--accent-soft-border-light', accentPalette.softBorderLight);
    root.style.setProperty('--accent-text-on-light-soft', accentPalette.textOnLightSoft);
    root.style.setProperty('--accent-soft-dark', accentPalette.softDark);

    try {
      window.dispatchEvent(
        new CustomEvent('smartsolve_theme_changed', {
          detail: {
            isDark,
            resolvedTheme,
            themePreference,
            accentColor: accentPalette.id,
            accentPalette,
          },
        })
      );
    } catch {}

    try {
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', isDark ? '#000000' : '#F8FAFC');

      let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaApple) {
        metaApple = document.createElement('meta');
        metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(metaApple);
      }
      metaApple.setAttribute('content', isDark ? 'black-translucent' : 'default');
    } catch {
      // ignore
    }
  }, [isDark, resolvedTheme, themePreference, accentPalette]);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // ignore
    }
  };

  const setAccentColor = (accent: AccentColorId) => {
    setAccentColorState(accent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
      // ignore
    }
  };

  const cycleTheme = () => {
    if (themePreference === 'system') {
      setThemePreference('dark');
    } else if (themePreference === 'dark') {
      setThemePreference('light');
    } else {
      setThemePreference('system');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        isDark,
        setThemePreference,
        cycleTheme,
        accentColor,
        accentPalette,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
