import { Tabs } from 'expo-router';

import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Shown with the tab bar but not as tab buttons (design: History under Activity, Goals under Progress).
          The custom BottomTabBar renders only the five main tabs, so no `href: null` is needed — in this
          Expo Router version `href: null` also makes a route unreachable. */}
      <Tabs.Screen name="history" options={{ title: 'Activity history' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
    </Tabs>
  );
}
