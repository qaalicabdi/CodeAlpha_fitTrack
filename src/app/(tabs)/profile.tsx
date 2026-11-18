import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Bell, Info, Lock, Moon, Ruler, ShieldCheck, Target, User } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { SettingsRow } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { Avatar } from '@/components/common/Avatar';
import { Card, Divider, PageTitle, Pill, Screen } from '@/components/common/layout';
import { BottomSheet } from '@/components/dialogs/overlays';
import { OptionCard, Switch } from '@/components/inputs/selection';
import { FITNESS_GOAL_ICON } from '@/constants/icons';
import type { ThemePreference } from '@/database/repositories/settingsRepository';
import { heightDisplay, weightDisplay, type MeasurementUnit } from '@/domain/format';
import { FITNESS_GOAL_LABEL } from '@/domain/profile';
import { BmiCard } from '@/features/profile/BmiCard';
import { useAppData, useProfile } from '@/state/AppDataProvider';
import { useStepTracking, type TrackingStatus } from '@/state/StepTrackingProvider';
import { useTheme } from '@/theme/ThemeProvider';

type Sheet = 'tracking' | 'units' | 'appearance' | 'privacy' | 'about' | 'notifications' | null;

const TRACKING_LABEL: Record<TrackingStatus, string> = {
  checking: 'Checking',
  enabled: 'Enabled',
  off: 'Off',
  denied: 'Not allowed',
  unavailable: 'Unavailable',
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** 21 Profile & Settings */
export default function ProfileScreen() {
  const router = useRouter();
  const profile = useProfile();
  const { settings, updateSettings } = useAppData();
  const tracking = useStepTracking();
  const { scheme, colors } = useTheme();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const unit = settings.measurementUnit;
  const weight = weightDisplay(profile.weightKg, unit);
  const height = heightDisplay(profile.heightCm, unit);
  const GoalIcon = FITNESS_GOAL_ICON[profile.fitnessGoal];

  const stat = (value: string, label: string) => (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <AppText variant="lead">{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );

  const runTracking = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bottomInset={false}>
      <PageTitle title="Your profile" />
      <Card style={{ alignItems: 'center', gap: 10 }}>
        <Avatar name={profile.fullName} uri={profile.photoUri} size={64} />
        <AppText variant="subheading" style={{ fontFamily: 'Inter_400Regular' }}>
          {profile.fullName}
        </AppText>
        <View style={{ alignItems: 'center' }}>
          <Pill icon={GoalIcon} label={FITNESS_GOAL_LABEL[profile.fitnessGoal]} />
        </View>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', marginTop: 8 }}>
          {stat(String(profile.age), 'years')}
          {stat(weight.value, weight.unit)}
          {stat(height.value, height.unit)}
        </View>
      </Card>

      <BmiCard weightKg={profile.weightKg} heightCm={profile.heightCm} age={profile.age} unit={unit} />

      <Card padded={false} style={{ paddingVertical: 4 }}>
        <SettingsRow icon={User} label="Edit Profile" onPress={() => router.push('/edit-profile')} />
        <Divider />
        <SettingsRow icon={Target} label="Daily Goals" onPress={() => router.push('/goals')} />
        <Divider />
        <SettingsRow icon={Bell} label="Notification Preferences" value={settings.notificationsEnabled ? 'On' : 'Off'} onPress={() => setSheet('notifications')} />
        <Divider />
        <SettingsRow icon={ShieldCheck} label="Step Tracking Permissions" value={TRACKING_LABEL[tracking.status]} onPress={() => setSheet('tracking')} />
        <Divider />
        <SettingsRow
          icon={Moon}
          label="Dark Mode"
          sublabel={settings.theme === 'system' ? 'Following system · tap for options' : undefined}
          onPress={() => setSheet('appearance')}
          right={<Switch value={scheme === 'dark'} onChange={(v) => void updateSettings({ theme: v ? 'dark' : 'light' })} accessibilityLabel="Dark mode" />}
        />
        <Divider />
        <SettingsRow icon={Ruler} label="Units" sublabel="Metric / Imperial" value={unit === 'metric' ? 'Metric' : 'Imperial'} onPress={() => setSheet('units')} />
        <Divider />
        <SettingsRow icon={Lock} label="Privacy Settings" value="Local only" onPress={() => setSheet('privacy')} />
        <Divider />
        <SettingsRow icon={Info} label="About FITTRACK" value={`v${APP_VERSION}`} onPress={() => setSheet('about')} />
      </Card>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={18} color={colors.primary} strokeWidth={1.6} />
        <AppText variant="captionRegular" color="textSecondary" align="center">
          {'Your health. Your data. Your device.\nBuilt local-first, with no account required.'}
        </AppText>
      </View>

      <BottomSheet visible={sheet === 'tracking'} title="Step tracking" onClose={() => setSheet(null)}>
        <AppText color="textSecondary">
          {tracking.status === 'enabled'
            ? `Steps are read from ${tracking.providerName ?? 'your device'}${tracking.liveOnly ? ' while FITTRACK is open' : ''}. Turning this off stops reading new data; steps already saved stay in your history.`
            : tracking.status === 'denied'
              ? 'Access was not allowed. Change it in your device settings, then come back.'
              : tracking.status === 'unavailable'
                ? "This device doesn't provide step data to FITTRACK. Manual logging still works."
                : 'Step tracking is off. Turn it on to fill your daily ring automatically.'}
        </AppText>
        {tracking.status === 'enabled' ? (
          <Button label="Turn Off Step Tracking" variant="secondary" loading={busy} onPress={() => void runTracking(tracking.disable)} />
        ) : tracking.status === 'off' ? (
          <Button label="Enable Activity Access" icon={ShieldCheck} loading={busy} onPress={() => void runTracking(tracking.enable)} />
        ) : null}
        {tracking.status === 'denied' || tracking.status === 'enabled' ? (
          <Button label="Open Device Settings" variant={tracking.status === 'denied' ? 'primary' : 'text'} onPress={() => void tracking.openSettings()} />
        ) : null}
      </BottomSheet>

      <BottomSheet visible={sheet === 'notifications'} title="Notification preferences" onClose={() => setSheet(null)}>
        <Card padded={false}>
          <SettingsRow
            icon={Bell}
            label="Goal reminders"
            sublabel={settings.notificationsEnabled ? 'On' : 'Off'}
            right={<Switch value={settings.notificationsEnabled} onChange={(v) => void updateSettings({ notificationsEnabled: v })} accessibilityLabel="Goal reminders" />}
          />
        </Card>
        <AppText variant="captionRegular" color="textSecondary">
          Your preference is saved on this device.
        </AppText>
      </BottomSheet>

      <BottomSheet visible={sheet === 'appearance'} title="Appearance" onClose={() => setSheet(null)}>
        {(['system', 'light', 'dark'] as ThemePreference[]).map((t) => (
          <OptionCard
            key={t}
            label={t === 'system' ? 'Match system' : t === 'light' ? 'Light' : 'Dark'}
            icon={Moon}
            selected={settings.theme === t}
            onPress={() => void updateSettings({ theme: t })}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={sheet === 'units'} title="Units" onClose={() => setSheet(null)}>
        {(['metric', 'imperial'] as MeasurementUnit[]).map((u) => (
          <OptionCard
            key={u}
            label={u === 'metric' ? 'Metric (km, kg, cm)' : 'Imperial (mi, lb, in)'}
            icon={Ruler}
            selected={unit === u}
            onPress={() => void updateSettings({ measurementUnit: u })}
          />
        ))}
        <AppText variant="captionRegular" color="textSecondary">
          Values are stored in metric and converted for display, so switching never changes your records.
        </AppText>
      </BottomSheet>

      <BottomSheet visible={sheet === 'privacy'} title="Privacy" onClose={() => setSheet(null)}>
        <AppText color="textSecondary">
          FITTRACK stores your profile, goals, steps and workouts in a database on this device only. There is no account, no cloud sync and no analytics. Step data is
          read only with your permission and is never sold or shared.
        </AppText>
        <AppText color="textSecondary">Uninstalling the app deletes all of its data.</AppText>
      </BottomSheet>

      <BottomSheet visible={sheet === 'about'} title="About FITTRACK" onClose={() => setSheet(null)}>
        <AppText variant="lead">FITTRACK v{APP_VERSION}</AppText>
        <AppText color="textSecondary">Move Better. Live Stronger. An intentional fitness companion that turns movement into momentum.</AppText>
        <AppText color="textSecondary">
          Energy is estimated with MET values from the Compendium of Physical Activities and your body weight. Distance is estimated from your height. These are
          estimates, not medical measurements.
        </AppText>
      </BottomSheet>
    </Screen>
  );
}
