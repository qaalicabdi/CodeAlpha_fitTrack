import { useRouter } from 'expo-router';
import { Activity, Footprints, HeartPulse, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { BackHeader, Card, Footnote, Screen, type IconComponent } from '@/components/common/layout';
import { useAppData } from '@/state/AppDataProvider';
import { useStepTracking } from '@/state/StepTrackingProvider';
import { useTheme } from '@/theme/ThemeProvider';

function Benefit({ icon: Icon, title, body }: { icon: IconComponent; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <Icon size={20} color={colors.primary} strokeWidth={1.6} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText>{title}</AppText>
        <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
          {body}
        </AppText>
      </View>
    </View>
  );
}

/** 06 Activity Permission (pre-permission explanation; the OS prompt follows). */
export default function Permission() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateSettings } = useAppData();
  const tracking = useStepTracking();
  const [busy, setBusy] = useState<'enable' | 'manual' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    await updateSettings({ onboardingCompleted: true });
    router.replace('/(tabs)');
  };

  const enable = async () => {
    setBusy('enable');
    setError(null);
    try {
      await tracking.enable();
      // Granted, denied or unavailable — the Activity tab shows the matching state.
      await finish();
    } catch {
      setError('Step access could not be requested. You can enable it later in Profile → Step Tracking Permissions.');
      setBusy(null);
    }
  };

  const manual = async () => {
    setBusy('manual');
    try {
      await finish();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <BackHeader title="Let every step count" />
      <Card tone="tint" style={{ alignItems: 'center', gap: 12, paddingVertical: 32, borderRadius: 24 }}>
        <Footprints size={44} color={colors.primary} strokeWidth={1.3} />
        <AppText variant="label" color="primaryText">
          YOUR MOVEMENT → YOUR PROGRESS
        </AppText>
      </Card>
      <AppText variant="leadRegular">Automatically count steps using your device’s motion sensors and supported health integrations.</AppText>
      <Card style={{ gap: 18 }}>
        <Benefit icon={Activity} title="Motion & fitness" body="Count steps and active movement." />
        <Benefit icon={HeartPulse} title="Health connection" body="Read activity from Apple Health on iOS or Health Connect on Android." />
        <Benefit icon={ShieldCheck} title="Private by design" body="Stored locally. Never sold or shared." />
      </Card>
      <Footnote>You choose what to allow in the next system prompt. You can revoke access in Settings at any time.</Footnote>
      {error ? <AppText color="errorText">{error}</AppText> : null}
      <Button label="Enable Activity Access" icon={ShieldCheck} onPress={enable} loading={busy === 'enable'} disabled={busy === 'manual'} />
      <Button label="Use Manual Logging Instead" variant="text" onPress={manual} disabled={busy !== null} />
    </Screen>
  );
}
