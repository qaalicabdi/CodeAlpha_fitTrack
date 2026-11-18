/**
 * FITTRACK design tokens — extracted from the Figma "Design System" page (see docs/design-spec.md).
 * Screens and components must read colors from `useTheme()`; never hard-code them.
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  /** Brand emerald — icons, rings, progress fills, large controls. */
  primary: string;
  /** Background of primary buttons (brand emerald in both themes). */
  primaryButton: string;
  /** Label colour on primary buttons (dark-green alias, 4.79:1 on #16A36A). */
  onPrimary: string;
  /** Small text / links in brand colour (accessible alias). */
  primaryText: string;
  /** Forest green — hero cards, splash, selected chips. */
  secondary: string;
  onSecondary: string;
  onSecondaryMuted: string;
  accent: string;
  background: string;
  surface: string;
  /** Tinted brand surface — secondary buttons, pills, selected options. */
  tint: string;
  tintBorder: string;
  border: string;
  track: string;
  barMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  error: string;
  errorText: string;
  paused: string;
  disabledBg: string;
  disabledText: string;
  skeleton: string;
  overlay: string;
  tabBar: string;
}

export const palette: Record<ColorScheme, ThemeColors> = {
  light: {
    primary: '#16A36A',
    primaryButton: '#16A36A',
    onPrimary: '#052A1B',
    primaryText: '#087C4B',
    secondary: '#123D2D',
    onSecondary: '#FFFFFF',
    onSecondaryMuted: 'rgba(255,255,255,0.72)',
    accent: '#B8F36B',
    background: '#F7F9F7',
    surface: '#FFFFFF',
    tint: '#EAF3EE',
    tintBorder: '#D7E8DE',
    border: '#E3E9E5',
    track: '#E3E8E5',
    barMuted: '#CFE3D7',
    text: '#17211D',
    textSecondary: '#65736B',
    textMuted: '#7C8781',
    error: '#E45D5D',
    errorText: '#B83232',
    paused: '#5F6F66',
    disabledBg: '#E3E8E5',
    disabledText: '#8A958F',
    skeleton: '#E6EEE9',
    overlay: 'rgba(12,21,17,0.45)',
    tabBar: '#FFFFFF',
  },
  dark: {
    primary: '#37C88B',
    primaryButton: '#16A36A',
    onPrimary: '#052A1B',
    primaryText: '#37C88B',
    secondary: '#123D2D',
    onSecondary: '#FFFFFF',
    onSecondaryMuted: 'rgba(255,255,255,0.72)',
    accent: '#B8F36B',
    background: '#0C1511',
    surface: '#15231C',
    tint: '#1B2E25',
    tintBorder: '#25402F',
    border: '#22342B',
    track: '#26382F',
    barMuted: '#3A5A48',
    text: '#F2F7F3',
    textSecondary: '#A0B0A8',
    textMuted: '#8A9A92',
    error: '#FF8585',
    errorText: '#FF8585',
    paused: '#A0B0A8',
    disabledBg: '#22342B',
    disabledText: '#6F7F77',
    skeleton: '#1E3027',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: '#101B16',
  },
};

/** 8-point spacing rhythm (plus 4 and 12 for tight internal gaps). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/** "Soft surfaces. Precise edges." */
export const radii = {
  indicator: 8,
  tile: 12,
  control: 16,
  card: 24,
  sheet: 28,
  device: 40,
  pill: 999,
} as const;

/** Touch targets: 44 minimum, 56 for primary controls. */
export const sizes = {
  minTouch: 44,
  primaryControl: 56,
  input: 52,
  iconSm: 16,
  icon: 20,
  iconLg: 24,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

/** Inter scale from the Design System page. */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 48, lineHeight: 54, letterSpacing: -1.2 },
  title: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 37, letterSpacing: -0.8 },
  heading: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  subheading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  lead: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  leadRegular: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15 },
  captionRegular: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15, letterSpacing: 1.6 },
  metric: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  metricLarge: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1 },
  timer: { fontFamily: fonts.bold, fontSize: 64, lineHeight: 72, letterSpacing: -2 },
} satisfies Record<string, TextStyleToken>;

export type TypographyVariant = keyof typeof typography;

/** "Raised / subtle shadow": x0 y4 blur16 #123D2D @ 8%. */
export const shadows = {
  raised: {
    shadowColor: '#123D2D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
