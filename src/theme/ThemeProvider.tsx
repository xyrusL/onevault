import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_THEME_CONFIG,
  FontScale,
  THEME_STORAGE_KEY,
  ThemeConfig,
  ThemeMode,
} from './theme.config';

interface ThemeContextValue extends ThemeConfig {
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setScale: (scale: FontScale) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_THEME_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_THEME_CONFIG;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', config.mode);
    root.setAttribute('data-scale', config.scale);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
  }, [config]);

  const setMode = (mode: ThemeMode) =>
    setConfig((prev) => ({ ...prev, mode }));

  const toggleMode = () =>
    setConfig((prev) => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));

  const setScale = (scale: FontScale) =>
    setConfig((prev) => ({ ...prev, scale }));

  return (
    <ThemeContext.Provider
      value={{
        ...config,
        setMode,
        toggleMode,
        setScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
