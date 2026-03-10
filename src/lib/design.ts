// Wren Health Design System — 2026
// Single warm palette: cream background, forest green accents, terracotta highlights.
// Target audience: parents managing family health. Warm, trustworthy, organized.

// ── Core Palette ──────────────────────────────────────────────────────────────
export const COLORS = {
  background: '#FAF7F4',           // warm cream — main screen bg
  surface: '#FFFFFF',              // white cards
  surfaceAlt: '#F2EDE8',           // slightly warmer cream for secondary surfaces
  surfaceSolid: '#FFFFFF',
  primary: '#2D6A4F',             // dark forest green — headers, labels, icons, active states
  primaryDark: '#1B4332',         // deepest forest
  primaryLight: '#40916C',        // medium green
  primaryMuted: 'rgba(45,106,79,0.10)',  // very subtle green tint
  primaryGlow: 'rgba(45,106,79,0.12)',
  rose: '#C9614A',                // terracotta — warm accent, CTAs, highlights
  roseLight: 'rgba(201,97,74,0.10)',
  amber: '#9A5800',
  amberLight: 'rgba(154,88,0,0.10)',
  textPrimary: '#1C1C1E',          // near-black — high contrast, readable
  textSecondary: 'rgba(28,28,30,0.62)',
  textTertiary: 'rgba(28,28,30,0.40)',
  textInverse: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(45,106,79,0.28)',
  divider: 'rgba(0,0,0,0.05)',
  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(28,28,30,0.72)',
  legacyBackground: '#FAF7F4',
  legacySurface: '#FFFFFF',
};

// ── Legacy aliases (backward compat) ─────────────────────────────────────────
export const DARK_COLORS = COLORS;
export const LIGHT_COLORS = COLORS;

// ── Gradients ─────────────────────────────────────────────────────────────────
export const GRADIENTS = {
  background: ['#FAF7F4', '#FAF7F4', '#F2EDE8'] as const,       // subtle warm gradient
  topGlow: ['rgba(45,106,79,0.06)', 'rgba(45,106,79,0.01)', 'transparent'] as const,
  card: ['#FFFFFF', '#FDFAF8'] as const,
  primaryBtn: ['#40916C', '#2D6A4F'] as const,                   // forest green CTA
  terraCTA: ['#D97355', '#C9614A'] as const,                     // terracotta CTA
  sectionAccent: ['rgba(45,106,79,0.08)', 'transparent'] as const,
  danger: ['rgba(201,97,74,0.12)', 'transparent'] as const,
};

// ── Legacy aliases ─────────────────────────────────────────────────────────────
export const DARK_GRADIENTS = GRADIENTS;
export const LIGHT_GRADIENTS = GRADIENTS;

// ── Typography ────────────────────────────────────────────────────────────────
export const FONTS = {
  h1: { fontSize: 34, fontWeight: '800' as const, lineHeight: 42, letterSpacing: -1 },
  h2: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36, letterSpacing: -0.6 },
  h3: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.3 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.2 },
  bodyLarge: { fontSize: 17, fontWeight: '500' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 23 },
  bodySmall: { fontSize: 14, fontWeight: '500' as const, lineHeight: 21 },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4 },
  caption: { fontSize: 13, fontWeight: '500' as const },
};

export const CARD = {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.06)',
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
  elevation: 3,
};

export const GLASS = {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.06)',
  shadowColor: 'rgba(45,106,79,0.15)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 16,
  elevation: 6,
};

export const BUTTON = {
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: 'rgba(45,106,79,0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};
