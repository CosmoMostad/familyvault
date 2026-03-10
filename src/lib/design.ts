// Wren Health Design System — 2026 Dark Edition
// Deep forest at night. Everything floats.

export const COLORS = {
  // ── Backgrounds ──────────────────────────────────────────────
  background: '#090D0B',          // near-black with forest tint
  surface: 'rgba(255,255,255,0.05)',   // glass card layer 1
  surfaceAlt: 'rgba(255,255,255,0.08)', // glass card layer 2 (elevated)
  surfaceSolid: '#111A14',        // opaque surface for inputs/modals

  // ── Brand ─────────────────────────────────────────────────────
  primary: '#52B788',             // medium green — readable on dark
  primaryDark: '#2D6A4F',         // deep green for gradients
  primaryLight: '#95D5B2',        // light green for highlights
  primaryMuted: 'rgba(82,183,136,0.15)', // subtle green tint
  primaryGlow: 'rgba(82,183,136,0.20)',  // green atmospheric glow

  // ── Accents ───────────────────────────────────────────────────
  rose: '#E07A5F',
  roseLight: 'rgba(224,122,95,0.15)',
  amber: '#F2A65A',
  amberLight: 'rgba(242,166,90,0.15)',

  // ── Text ─────────────────────────────────────────────────────
  textPrimary: '#F2FAF5',         // bright white with green tint
  textSecondary: 'rgba(242,250,245,0.78)',
  textTertiary: 'rgba(242,250,245,0.52)',
  textInverse: '#090D0B',

  // ── UI Chrome ────────────────────────────────────────────────
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(82,183,136,0.25)',
  divider: 'rgba(255,255,255,0.05)',
  shadow: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(9,13,11,0.85)',

  // ── Legacy (keep for untouched screens) ──────────────────────
  legacyBackground: '#FAF7F4',
  legacySurface: '#FFFFFF',
};

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

// ── Gradient presets ──────────────────────────────────────────────────────────
export const GRADIENTS = {
  // Background — deep forest atmosphere
  background: ['#090D0B', '#0D1810', '#090D0B'] as const,
  // Top glow — green light from above
  topGlow: ['rgba(82,183,136,0.18)', 'rgba(82,183,136,0.06)', 'transparent'] as const,
  // Card surface
  card: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)'] as const,
  // Primary button
  primaryBtn: ['#5BC898', '#2D6A4F'] as const,
  // Section accent
  sectionAccent: ['rgba(82,183,136,0.22)', 'transparent'] as const,
  // Danger
  danger: ['rgba(224,122,95,0.20)', 'transparent'] as const,
};
