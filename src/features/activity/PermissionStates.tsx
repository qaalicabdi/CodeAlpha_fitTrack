import { Footprints, Plus, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { Platform, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { Card, IconTile, Pill } from '@/components/common/layout';
import { BottomSheet } from '@/components/dialogs/overlays';
import { useTheme } from '@/theme/ThemeProvider';

/** 09 — tracking off / not yet allowed. */
export function PermissionNeededCard({ onEnable, onLog, busy }: { onEnable: () => void; onLog: () => void; busy?: boolean }) {
  const { colors } = useTheme();
  return (
    <>
      <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 32 }}>
        <IconTile icon={Footprints} size={72} />
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.paused }} />
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.paused }} />
        </View>
        <AppText color="textSecondary">Step data unavailable</AppText>
        <AppText variant="heading" align="center">
          {'A little access.\nA clearer picture.'}
        </AppText>
        <AppText color="textSecondary" align="center" variant="leadRegular" style={{ fontSize: 16 }}>
          Allow motion and health access to see your steps, distance and hourly movement. Nothing is tracked until you choose.
        </AppText>
      </Card>
      <Button label="Enable Activity Permission" icon={ShieldCheck} onPress={onEnable} loading={busy} />
      <Button label="Log Activity Manually" icon={Plus} variant="secondary" onPress={onLog} />
      <Card style={{ gap: 10 }}>
        <AppText variant="bodyStrong">You’re always in control.</AppText>
        <AppText color="textSecondary">Manual workouts stay available without sensor access. Review or revoke permissions in Profile → Step Tracking Permissions.</AppText>
      </Card>
    </>
  );
}

/** Supporting state 5 — permission denied. */
export function PermissionDeniedCard({ onOpenSettings, onLog }: { onOpenSettings: () => void; onLog: () => void }) {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 14 }}>
      <ShieldAlert size={26} color={colors.error} strokeWidth={1.6} />
      <AppText variant="heading">Step access is off.</AppText>
      <AppText color="textSecondary">No sensor data is available. You can change access in your device settings, or continue with manual activity logging.</AppText>
      <AppText variant="captionRegular" color="textSecondary">
        {Platform.OS === 'ios'
          ? 'iOS: Settings → Privacy & Security → Motion & Fitness'
          : 'Android: Settings → Apps → FITTRACK → Permissions\nHealth Connect: Settings → Health Connect → App permissions'}
        {'\nHealth access is managed separately in your health app.'}
      </AppText>
      <Button label="Open Device Settings" onPress={onOpenSettings} />
      <Button label="Log Activity Manually" variant="secondary" onPress={onLog} />
    </Card>
  );
}

/** Device cannot provide steps (no sensor, web, Health Connect missing and no step counter). */
export function TrackingUnavailableCard({ onLog }: { onLog: () => void }) {
  return (
    <Card style={{ gap: 14 }}>
      <IconTile icon={Footprints} />
      <AppText variant="heading">Step tracking isn’t available here.</AppText>
      <AppText color="textSecondary">
        This device doesn’t provide step data to FITTRACK. Your workouts and manual entries still count toward energy, active minutes and goals.
      </AppText>
      <Button label="Log Activity Manually" icon={Plus} onPress={onLog} />
    </Card>
  );
}

/** Supporting state 4 — explanation shown before the OS permission prompt. */
export function PrePermissionSheet({ visible, onContinue, onManual, onClose }: { visible: boolean; onContinue: () => void; onManual: () => void; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} title="Allow activity access?" onClose={onClose}>
      <ShieldCheck size={26} color={colors.primary} strokeWidth={1.6} />
      <AppText color="textSecondary">
        FITTRACK uses device motion and your chosen health connection to count steps. Only requested activity data is read and stored locally.
      </AppText>
      <Pill label={Platform.OS === 'ios' ? 'Apple Health / Motion & Fitness' : 'Health Connect / Step sensor'} />
      <Button label="Continue to System Permission" onPress={onContinue} />
      <Button label="Not Now · Log Manually" variant="secondary" onPress={onManual} />
      <AppText variant="captionRegular" color="textSecondary">
        The next prompt is controlled by iOS or Android. This is a pre-permission explanation, not an OS dialog.
      </AppText>
    </BottomSheet>
  );
}
