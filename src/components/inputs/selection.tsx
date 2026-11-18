import { CircleCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import type { IconComponent } from '@/components/common/layout';
import { useTheme } from '@/theme/ThemeProvider';

/** FITTRACK / Activity Card — selectable option row with radio/check (screens 05, 10, 22). */
export function OptionCard({ label, icon: Icon, selected, onPress }: { label: string; icon: IconComponent; selected: boolean; onPress: () => void }) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.option,
        {
          borderRadius: radii.control,
          backgroundColor: selected ? colors.tint : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth * 2,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Icon size={20} color={selected ? colors.primary : colors.textSecondary} strokeWidth={1.6} />
      <AppText variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </AppText>
      {selected ? (
        <CircleCheck size={20} color={colors.primary} strokeWidth={1.6} />
      ) : (
        <View style={[styles.radio, { borderColor: colors.border }]} />
      )}
    </Pressable>
  );
}

/** FITTRACK / Period Tabs — segmented control (Daily / Weekly / Monthly, date-range presets). */
export function PeriodTabs<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors, radii } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: colors.track, borderRadius: radii.control }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, { borderRadius: radii.control - 4, backgroundColor: active ? colors.surface : 'transparent' }]}
          >
            <AppText variant={active ? 'bodyStrong' : 'body'} color={active ? 'primaryText' : 'textSecondary'}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** History filter chip. */
export function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          borderRadius: radii.pill,
          backgroundColor: selected ? colors.secondary : colors.surface,
          borderColor: selected ? colors.secondary : colors.border,
        },
      ]}
    >
      <AppText variant="label" style={{ color: selected ? colors.onSecondary : colors.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** FITTRACK / Switch. */
export function Switch({ value, onChange, accessibilityLabel }: { value: boolean; onChange: (v: boolean) => void; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={[styles.switchTrack, { backgroundColor: value ? colors.primary : colors.track }]}
    >
      <View style={[styles.switchThumb, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 58, paddingHorizontal: 16 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  tabs: { flexDirection: 'row', padding: 4 },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2, flexGrow: 1, flexBasis: '30%' },
  switchTrack: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
});
