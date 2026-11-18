import { Redirect } from 'expo-router';

import { useAppData } from '@/state/AppDataProvider';

/** Entry gate: onboarding for first launch, otherwise the dashboard. */
export default function Index() {
  const { profile, settings } = useAppData();
  if (!profile || !settings.onboardingCompleted) return <Redirect href="/splash" />;
  return <Redirect href="/(tabs)" />;
}
