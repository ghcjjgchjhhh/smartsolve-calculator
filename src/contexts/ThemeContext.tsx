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
    } catch {
      // fallback
    }
    return 'system'; // Default to system to seamlessly follow phone OS appearance!
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Listen to OS system color scheme changes with support for modern and legacy Safari
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

  // Compute resolved theme
  const resolvedTheme: ResolvedTheme =
    themePreference === 'system' ? (systemIsDark ? 'dark' : 'light') : themePreference;

  const isDark = resolvedTheme === 'dark';

  // Apply theme to document root, body, and mobile meta tags
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

    // Broadcast theme update event
    try {
      window.dispatchEvent(
        new CustomEvent('smartsolve_theme_changed', {
          detail: { isDark, resolvedTheme, themePreference },
        })
      );
    } catch {}

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
