import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemePreference } from '@/database/repositories/settingsRepository';
import { fonts, palette, radii, shadows, sizes, spacing, typography, type ColorScheme, type ThemeColors } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  sizes: typeof sizes;
  typography: typeof typography;
  fonts: typeof fonts;
  shadows: typeof shadows;
}

function buildTheme(scheme: ColorScheme): Theme {
  return { scheme, colors: palette[scheme], spacing, radii, sizes, typography, fonts, shadows };
}

const ThemeContext = createContext<Theme>(buildTheme('light'));

export function ThemeProvider({ preference, children }: { preference: ThemePreference; children: ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
