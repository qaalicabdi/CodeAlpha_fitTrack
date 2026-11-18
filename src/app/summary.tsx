import { useRouter } from 'expo-router';
import { Bookmark, Check, Flame, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { KeyValueRow, StatCard } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { ErrorCard, LoadingState } from '@/components/common/feedback';
import { Card, Footnote, PageTitle, Pill, Screen } from '@/components/common/layout';
import { Dialog } from '@/components/dialogs/overlays';
import { ACTIVITY_INFO } from '@/domain/activityTypes';
import { formatTime, formatWeekdayShort } from '@/domain/dates';
import { distanceValue, formatInt, formatPercent, paceLabel } from '@/domain/format';
import { firstName } from '@/domain/profile';
import { formatClock } from '@/domain/timer';
import { useWorkoutSession } from '@/features/workouts/useWorkoutSession';
import { saveTimerWorkout, summarizeSession } from '@/services/activityService';
import { useAppData, useProfile } from '@/state/AppDataProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** 15 Workout Summary */
export default function SummaryScreen() {
  const router = useRouter();
  const profile = useProfile();
  const { db, settings, invalidate } = useAppData();
  const { colors } = useTheme();
  const { session, loaded, discard } = useWorkoutSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!loaded) {
    return (
      <Screen>
        <LoadingState label="Loading your session…" />
      </Screen>
    );
  }

  if (!session || session.status !== 'finished') {
    return (
      <Screen>
        <PageTitle title="Workout complete" />
        <Card style={{ gap: 12 }}>
          <AppText variant="lead">No finished workout to review.</AppText>
          <AppText color="textSecondary">It may already be saved. You’ll find saved sessions in Activity History.</AppText>
          <Button label="Back to Dashboard" onPress={() => router.replace('/(tabs)')} />
        </Card>
      </Screen>
    );
  }

  // A finished session always has endedAt; elapsed time no longer depends on "now".
  const s = summarizeSession(session, profile.weightKg, session.endedAt ?? session.startedAt + session.accumulatedMs);
  const dist = s.distanceM !== null ? distanceValue(s.distanceM, settings.measurementUnit) : null;
  const pace = s.distanceM !== null ? paceLabel(s.durationSeconds, s.distanceM, settings.measurementUnit) : null;
  const info = ACTIVITY_INFO[s.activityType];
  const goalMinutes = Math.round(session.goalSeconds / 60);

  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      await saveTimerWorkout(db, session, profile);
      invalidate();
      router.replace('/(tabs)');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageTitle title="Workout complete" />
      <Card tone="hero" style={{ alignItems: 'center', gap: 10 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={28} color={colors.secondary} strokeWidth={2} />
        </View>
        <AppText variant="heading" color="onSecondary" style={{ fontFamily: 'Inter_400Regular' }}>
          Strong finish, {firstName(profile.fullName)}.
        </AppText>
        <AppText color="onSecondaryMuted">
          {info.label} · {formatWeekdayShort(s.start)}
        </AppText>
        <AppText variant="captionRegular" color="onSecondaryMuted">
          {formatTime(s.start)} – {formatTime(s.end)}
        </AppText>
      </Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard icon={Timer} value={formatClock(s.durationSeconds * 1000)} label="Total duration" />
        <StatCard icon={Flame} value={formatInt(s.calories)} unit="kcal" label="Estimated energy" />
      </View>
      <Card style={{ gap: 12 }}>
        <AppText variant="lead">Your session, in numbers</AppText>
        {dist ? <KeyValueRow label="Est. distance" value={`${dist.value} ${dist.unit}`} /> : null}
        {pace ? <KeyValueRow label="Average pace" value={pace} /> : null}
        <KeyValueRow label={`${goalMinutes}-minute goal`} value={`${formatPercent(s.goalRatio * 100)} complete`} />
        <KeyValueRow label="Activity type" value={info.label} />
      </Card>

      {error ? (
        <ErrorCard
          title="Workout wasn't saved."
          message={`We couldn't write to local storage. Your ${info.label.toLowerCase()} session is still here: ${formatClock(s.durationSeconds * 1000)}, ${formatInt(s.calories)} kcal. Free some device space, then try again.`}
          onRetry={() => void save()}
          retryLabel="Retry Save"
        />
      ) : (
        <>
          <Pill icon={Bookmark} label="Not saved yet" />
          <Button label="Save Workout" icon={Check} onPress={() => void save()} loading={saving} />
        </>
      )}
      <Button label="Back to Dashboard" variant="text" disabled={saving} onPress={() => setConfirmDiscard(true)} />
      <Footnote>Not yet included in today’s totals. Saving adds this workout once. Energy and distance are estimates.</Footnote>

      <Dialog visible={confirmDiscard} onClose={() => setConfirmDiscard(false)}>
        <AppText variant="heading">Leave without saving?</AppText>
        <AppText color="textSecondary">This {info.label.toLowerCase()} session won’t be added to your history or totals.</AppText>
        <Button
          label="Discard Workout"
          variant="danger"
          onPress={async () => {
            setConfirmDiscard(false);
            await discard();
            router.replace('/(tabs)');
          }}
        />
        <Button label="Keep Reviewing" variant="secondary" onPress={() => setConfirmDiscard(false)} />
      </Dialog>
    </Screen>
  );
}
