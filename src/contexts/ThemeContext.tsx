import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';
export type AccentColorId =
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'lime'
  | 'cyan';

export interface AccentPalette {
  id: AccentColorId;
  name: string;
  tagline: string;
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
  {
    id: 'emerald',
    name: 'Emerald',
    tagline: 'Precision STEM',
    primary: '#22C55E',
    primaryLightMode: '#16A34A',
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
    id: 'violet',
    name: 'Violet',
    tagline: 'AI Studio',
    primary: '#8B5CF6',
    primaryLightMode: '#7C3AED',
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
    id: 'amber',
    name: 'Amber',
    tagline: 'Lab Gold',
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
    id: 'orange',
    name: 'Orange',
    tagline: 'Solar Action',
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
    id: 'rose',
    name: 'Rose',
    tagline: 'Bio Crimson',
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
    id: 'lime',
    name: 'Lime',
    tagline: 'Tactical Pro',
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
    id: 'cyan',
    name: 'Cyan',
    tagline: 'Instrument',
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
