// Centralized Design Tokens for Ghar Sansar Mobile Application
export const colors = {
  // Brand
  brandForestGreen: '#031c03',
  brandGold: '#031c03',
  brandGoldLight: '#0d380d',
  brandGoldDark: '#011001',
  brandGoldBg: 'rgba(3, 28, 3, 0.08)',
  brandCharcoal: '#121415',

  // Neutrals / Surfaces
  background: '#FFFFFF',
  backgroundWarm: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F6F7',
  surfaceTertiary: '#ECEEF0',
  cardBorder: '#ECEEF0',
  cardBorderHover: '#DFE2E5',

  // Typography
  textPrimary: '#121415',
  textSecondary: '#666C72',
  textMuted: '#959CA3',
  textInverse: '#FFFFFF',

  // Status & Highlights
  accentRed: '#D32F2F',
  accentRedBg: '#FDF2F2',
  accentGreen: '#00875A',
  accentGreenBg: '#E8F5E9',
  starYellow: '#F59E0B',

  // Aliases for unified screen usage
  primary: '#121415',
  accent: '#031c03',
  surfaceAlt: '#F5F6F7',
  border: '#ECEEF0',
  borderLight: '#ECEEF0',
  discount: '#D32F2F',
  savings: '#00875A',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pageHorizontal: 16,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  card: 16,
  banner: 20,
  pill: 100,
  button: 12,
  input: 12,
};

export const typography = {
  screenTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  pricePrimary: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.textPrimary,
  },
  priceMrp: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textMuted,
    textDecorationLine: 'line-through' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  tiny: {
    fontSize: 10.5,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
};

export const shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bottomNav: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
};

export default tokens;
