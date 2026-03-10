import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, DARK_GRADIENTS, LIGHT_GRADIENTS } from '../lib/design';

const THEME_KEY = 'wrenhealth_theme';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSolid: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  primaryGlow: string;
  rose: string;
  roseLight: string;
  amber: string;
  amberLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  divider: string;
  shadow: string;
  overlay: string;
  legacyBackground: string;
  legacySurface: string;
}

export interface ThemeGradients {
  background: readonly string[];
  topGlow: readonly string[];
  card: readonly string[];
  primaryBtn: readonly string[];
  sectionAccent: readonly string[];
  danger: readonly string[];
}

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  gradients: ThemeGradients;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  colors: DARK_COLORS,
  gradients: DARK_GRADIENTS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val !== null) setIsDark(val === 'dark');
      setLoaded(true);
    });
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      gradients: isDark ? DARK_GRADIENTS : LIGHT_GRADIENTS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
