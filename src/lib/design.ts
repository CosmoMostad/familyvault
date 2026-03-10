// Wren Health Design System — 2026 Dual Theme
// Dark: deep forest at night. Light: open meadow morning.

// ── Dark Palette ──────────────────────────────────────────────────────────────
export const DARK_COLORS = {
  background: '#090D0B',
  surface: 'rgba(255,255,255,0.05)',
  surfaceAlt: 'rgba(255,255,255,0.08)',
  surfaceSolid: '#111A14',
  primary: '#52B788',
  primaryDark: '#2D6A4F',
  primaryLight: '#74C69D',
  primaryMuted: 'rgba(82,183,136,0.15)',
  primaryGlow: 'rgba(82,183,136,0.20)',
  rose: '#E07A5F',
  roseLight: 'rgba(224,122,95,0.15)',
  amber: '#F2A65A',
  amberLight: 'rgba(242,166,90,0.15)',
  textPrimary: '#F2FAF5',
  textSecondary: 'rgba(242,250,245,0.78)',
  textTertiary: 'rgba(242,250,245,0.42)',
  textInverse: '#090D0B',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(82,183,136,0.25)',
  divider: 'rgba(255,255,255,0.05)',
  shadow: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(9,13,11,0.85)',
  legacyBackground: '#FAF7F4',
  legacySurface: '#FFFFFF',
};

// ── Light Palette ─────────────────────────────────────────────────────────────
// Light mode = deep forest green background, pure white cards.
// Background is darkest forest green so nav header & gradient start match.
export const LIGHT_COLORS = {
  background: '#1B4332',           // deepest forest green — matches gradient start, no seam
  surface: '#FFFFFF',              // white cards that pop off the green
  surfaceAlt: '#EEF7F2',
  surfaceSolid: '#FFFFFF',
  primary: '#2D6A4F',             // dark forest green for accents on white cards
  primaryDark: '#1B4332',
  primaryLight: '#52B788',
  primaryMuted: 'rgba(45,106,79,0.12)',
  primaryGlow: 'rgba(45,106,79,0.15)',
  rose: '#C0472B',
  roseLight: 'rgba(192,71,43,0.10)',
  amber: '#9A5800',
  amberLight: 'rgba(154,88,0,0.10)',
  textPrimary: '#0D1810',          // dark text — 7.6:1 contrast on #52B788 ✓
  textSecondary: 'rgba(13,24,16,0.72)',
  textTertiary: 'rgba(13,24,16,0.52)',
  textInverse: '#FFFFFF',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(45,106,79,0.30)',
  divider: 'rgba(0,0,0,0.07)',
  shadow: 'rgba(0,0,0,0.20)',
  overlay: 'rgba(45,106,79,0.92)',
  legacyBackground: '#FAF7F4',
  legacySurface: '#FFFFFF',
};

// ── Legacy alias (backward compat — dark by default) ─────────────────────────
export const COLORS = DARK_COLORS;

// ── Dark Gradients ────────────────────────────────────────────────────────────
export const DARK_GRADIENTS = {
  background: ['#090D0B', '#0D1810', '#090D0B'] as const,
  topGlow: ['rgba(82,183,136,0.18)', 'rgba(82,183,136,0.06)', 'transparent'] as const,
  card: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)'] as const,
  primaryBtn: ['#5BC898', '#2D6A4F'] as const,
  sectionAccent: ['rgba(82,183,136,0.22)', 'transparent'] as const,
  danger: ['rgba(224,122,95,0.20)', 'transparent'] as const,
};

// ── Light Gradients ───────────────────────────────────────────────────────────
export const LIGHT_GRADIENTS = {
  background: ['#1B4332', '#2D6A4F', '#40916C'] as const,  // deep forest → rich green (no mint)
  topGlow: ['rgba(27,67,50,0.60)', 'rgba(27,67,50,0.20)', 'transparent'] as const,
  card: ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.85)'] as const,
  primaryBtn: ['#52C48A', '#2D6A4F'] as const,
  sectionAccent: ['rgba(45,106,79,0.10)', 'transparent'] as const,
  danger: ['rgba(192,71,43,0.12)', 'transparent'] as const,
};

// ── Legacy alias (backward compat) ───────────────────────────────────────────
export const GRADIENTS = DARK_GRADIENTS;

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
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.09)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 6,
};

export const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.09)',
  shadowColor: 'rgba(82,183,136,0.3)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 8,
};

export const BUTTON = {
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
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
