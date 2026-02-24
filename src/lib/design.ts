// Rosemary Design System
// Warm, trustworthy, mom-friendly health app

export const COLORS = {
  // Backgrounds
  background: '#FAF7F4',
  surface: '#FFFFFF',
  surfaceAlt: '#F2EDE8',

  // Brand — deep forest green
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  primaryMuted: '#D8F3DC',

  // Accents
  rose: '#C9614A',
  roseLight: '#FDECEA',
  amber: '#D97706',
  amberLight: '#FEF3C7',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // UI
  border: '#E8E2DB',
  divider: '#F0EBE4',
  shadow: 'rgba(0,0,0,0.06)',
};

export const FONTS = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.8 },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

export const CARD = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export const BUTTON = {
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
