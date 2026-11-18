import type { Tabs } from 'expo-router';
import { ChartNoAxesColumnIncreasing, Dumbbell, Footprints, House, User } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import type { IconComponent } from '@/components/common/layout';
import { useTheme } from '@/theme/ThemeProvider';

/** Visible tabs. Hidden routes (goals, history) highlight the tab they belong to. */
const TABS: { name: string; label: string; icon: IconComponent }[] = [
  { name: 'index', label: 'Home', icon: House },
  { name: 'activity', label: 'Activity', icon: Footprints },
  { name: 'workout', label: 'Workout', icon: Dumbbell },
  { name: 'progress', label: 'Progress', icon: ChartNoAxesColumnIncreasing },
  { name: 'profile', label: 'Profile', icon: User },
];

const OWNER: Record<string, string> = { history: 'activity', goals: 'progress' };

export type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** FITTRACK / Bottom Navigation. */
export function BottomTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index]?.name ?? 'index';
  const activeName = OWNER[currentName] ?? currentName;
  return (
    <View style={[styles.bar, { backgroundColor: colors.tabBar, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const focused = tab.name === activeName;
        const color = focused ? colors.primaryText : colors.textSecondary;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const route = state.routes.find((r) => r.name === tab.name);
              if (!route) return;
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!event.defaultPrevented && currentName !== tab.name) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <Icon size={22} color={color} strokeWidth={focused ? 2 : 1.6} />
            <AppText variant="caption" style={{ color, fontFamily: focused ? fonts.bold : fonts.medium }}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48 },
});
