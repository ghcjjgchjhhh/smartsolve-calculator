import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'smartsolve_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'system' || saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Migrate legacy boolean if present
      const legacy = localStorage.getItem('smartsolve_dark_mode');
      if (legacy !== null) {
        return legacy === 'true' ? 'dark' : 'light';
      }
    } catch {
      // fallback
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  // Listen to OS system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemIsDark(e.matches);
      };

      setSystemIsDark(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // ignore
    }
  }, []);

  // Compute resolved theme
  const resolvedTheme: ResolvedTheme =
    themePreference === 'system' ? (systemIsDark ? 'dark' : 'light') : themePreference;

  const isDark = resolvedTheme === 'dark';

  // Apply theme to document root and mobile meta tags
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Update mobile theme-color and status-bar
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
  }, [isDark]);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
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
