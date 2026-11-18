import { ChevronDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';

interface FieldFrameProps {
  label?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

function FieldFrame({ label, required, helper, error, style, children }: FieldFrameProps) {
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? (
        <AppText variant="label">
          {label}
          {required ? ' *' : ''}
        </AppText>
      ) : null}
      {children}
      {error ? (
        <AppText variant="captionRegular" color="errorText" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="captionRegular" color="textSecondary">
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

function useFieldColors(focused: boolean, error: boolean, disabled: boolean) {
  const { colors } = useTheme();
  return {
    bg: disabled ? colors.tint : colors.surface,
    border: error ? colors.error : focused ? colors.primary : colors.border,
    borderWidth: error || focused ? 1.5 : StyleSheet.hairlineWidth * 2,
    text: disabled ? colors.textMuted : colors.text,
  };
}

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** FITTRACK / Input — default, focused, error, disabled states with optional unit suffix. */
export function Input({ label, value, onChangeText, suffix, placeholder, helper, error, required, disabled, keyboardType, maxLength, autoFocus, style, accessibilityLabel }: InputProps) {
  const { colors, radii, sizes, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const c = useFieldColors(focused, !!error, !!disabled);
  return (
    <FieldFrame label={label} required={required} helper={helper} error={error} style={style}>
      <View style={[styles.field, { minHeight: sizes.input, backgroundColor: c.bg, borderColor: c.border, borderWidth: c.borderWidth, borderRadius: radii.control }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: !!disabled }}
          style={[typography.body, { flex: 1, fontSize: 16, color: c.text, paddingVertical: 12 }]}
        />
        {suffix ? (
          <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
            {suffix}
          </AppText>
        ) : null}
      </View>
    </FieldFrame>
  );
}

/** Read-only field that opens a picker (activity type, date, time, ranges). */
export function SelectField({
  label,
  value,
  hint,
  onPress,
  error,
  helper,
  icon,
  showChevron = true,
  style,
}: {
  label?: string;
  value: string;
  hint?: string;
  onPress: () => void;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radii, sizes } = useTheme();
  const c = useFieldColors(false, !!error, false);
  return (
    <FieldFrame label={label} error={error} helper={helper} style={style}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value}` : value}
        style={({ pressed }) => [
          styles.field,
          { minHeight: sizes.input, backgroundColor: c.bg, borderColor: c.border, borderWidth: c.borderWidth, borderRadius: radii.control, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        {icon}
        <AppText style={{ flex: 1, fontSize: 16 }} numberOfLines={1}>
          {value}
        </AppText>
        {hint ? (
          <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
            {hint}
          </AppText>
        ) : null}
        {showChevron ? <ChevronDown size={18} color={colors.textSecondary} /> : null}
      </Pressable>
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
});
