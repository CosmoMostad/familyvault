/**
 * ThemeContext — single warm palette. Dark mode removed.
 * API is kept identical so no consumer files need changes.
 */
import React from 'react';
import { COLORS, GRADIENTS } from '../lib/design';

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

const THEME_VALUE = {
  isDark: false,
  toggleTheme: () => {},
  colors: COLORS as ThemeColors,
  gradients: GRADIENTS as unknown as ThemeGradients,
};

// ThemeProvider is now a simple passthrough — kept for App.tsx compatibility
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return THEME_VALUE;
}
