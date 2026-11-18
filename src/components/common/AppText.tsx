import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeColors, TypographyVariant } from '@/theme/tokens';

export type TextColor = keyof Pick<
  ThemeColors,
  'text' | 'textSecondary' | 'textMuted' | 'primary' | 'primaryText' | 'onPrimary' | 'onSecondary' | 'onSecondaryMuted' | 'accent' | 'errorText' | 'disabledText'
>;

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
}

/** Theme-aware text. Every string in the app renders through this. */
export function AppText({ variant = 'body', color = 'text', align, uppercase, style, ...rest }: AppTextProps) {
  const { typography, colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[typography[variant], { color: colors[color], textAlign: align }, uppercase && { textTransform: 'uppercase' }, style]}
    />
  );
}
