// Per-weight imports so only the four weights the design uses are bundled.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from '@expo-google-fonts/inter/useFonts';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { Suspense, useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorCard, LoadingState } from '@/components/common/feedback';
import { Screen } from '@/components/common/layout';
import { migrateDatabase } from '@/database/migrations';
import type { SqlDatabase } from '@/database/types';
import { AppDataProvider, useAppData } from '@/state/AppDataProvider';
import { StepTrackingProvider } from '@/state/StepTrackingProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export const DATABASE_NAME = 'fittrack.db';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <Suspense fallback={<Boot />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={(db) => migrateDatabase(db as unknown as SqlDatabase).then(() => undefined)} useSuspense>
          <DatabaseReady />
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}

function Boot() {
  return (
    <ThemeProvider preference="system">
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    </ThemeProvider>
  );
}

function DatabaseReady() {
  const db = useSQLiteContext() as unknown as SqlDatabase;
  return (
    <AppDataProvider db={db} fallback={<Boot />}>
      <ThemedApp>
        <StepTrackingProvider>
          <RootStack />
        </StepTrackingProvider>
      </ThemedApp>
    </AppDataProvider>
  );
}

function ThemedApp({ children }: { children: ReactNode }) {
  const { settings } = useAppData();
  return (
    <ThemeProvider preference={settings.theme}>
      <ThemeChrome />
      {children}
    </ThemeProvider>
  );
}

/** Keeps the status bar and root background in sync with the active theme. */
function ThemeChrome() {
  const { scheme, colors } = useTheme();
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function RootStack() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="timer" options={{ gestureEnabled: false }} />
      <Stack.Screen name="summary" options={{ gestureEnabled: false }} />
      <Stack.Screen name="log" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}

/** Route-level error boundary: shows a recoverable error instead of a blank screen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ThemeProvider preference="system">
      <View style={{ flex: 1 }}>
        <Screen>
          <ErrorCard title="Something went wrong." message={`${error.message}\nYour saved data is safe on this device.`} onRetry={retry} />
        </Screen>
      </View>
    </ThemeProvider>
  );
}
