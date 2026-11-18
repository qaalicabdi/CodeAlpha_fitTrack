import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/common/AppText';
import type { IconComponent } from '@/components/common/layout';
import { useTheme } from '@/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'text';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconComponent;
  loading?: boolean;
  disabled?: boolean;
  /** 56 (primary controls) or 48 */
  size?: 'large' | 'medium';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** FITTRACK / Button — primary, tinted secondary, dark, danger outline and text variants. */
export function Button({ label, onPress, variant = 'primary', icon: Icon, loading, disabled, size = 'large', style, accessibilityHint }: ButtonProps) {
  const { colors, radii, sizes } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primaryButton, fg: colors.onPrimary, border: 'transparent' },
    secondary: { bg: colors.tint, fg: colors.primaryText, border: colors.tintBorder },
    dark: { bg: colors.secondary, fg: colors.accent, border: 'transparent' },
    danger: { bg: 'transparent', fg: colors.errorText, border: colors.text },
    text: { bg: 'transparent', fg: colors.primaryText, border: 'transparent' },
  }[variant];

  const bg = disabled ? colors.disabledBg : palette.bg;
  const fg = disabled ? colors.disabledText : palette.fg;
  const height = variant === 'text' ? sizes.minTouch : size === 'large' ? sizes.primaryControl - 4 : 48;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          backgroundColor: pressed && variant === 'primary' && !inactive ? colors.secondary : bg,
          borderRadius: radii.control,
          borderWidth: variant === 'danger' ? 1.5 : variant === 'secondary' && !disabled ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: palette.border,
          opacity: pressed && variant !== 'primary' ? 0.7 : 1,
        },
        style,
      ]}
    >
      {({ pressed }) => {
        const color = pressed && variant === 'primary' && !inactive ? '#FFFFFF' : fg;
        return (
          <View style={styles.content}>
            {loading ? <ActivityIndicator size="small" color={color} /> : Icon ? <Icon size={18} color={color} strokeWidth={1.8} /> : null}
            <AppText variant="bodyStrong" style={{ color }}>
              {label}
            </AppText>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
