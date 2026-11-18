import { useRouter } from 'expo-router';
import { Play, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { HistoryRow, StatCard } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { EmptyHistory, ErrorCard, LoadingState } from '@/components/common/feedback';
import { Footnote, PageTitle, Pill, Screen, SectionHeader } from '@/components/common/layout';
import { Dialog } from '@/components/dialogs/overlays';
import { OptionCard } from '@/components/inputs/selection';
import { ACTIVITY_ICON } from '@/constants/icons';
import { getSession } from '@/database/repositories/sessionRepository';
import { listRecentWorkouts, listWorkouts } from '@/database/repositories/workoutsRepository';
import { ACTIVITY_INFO, ACTIVITY_TYPES, type ActivityType } from '@/domain/activityTypes';
import { formatRange, weekRange } from '@/domain/dates';
import { formatInt } from '@/domain/format';
import { workoutRowText } from '@/features/history/workoutText';
import { useNow } from '@/hooks/useNow';
import { useDbQuery } from '@/state/AppDataProvider';

/** 10 Workout */
export default function WorkoutScreen() {
  const router = useRouter();
  const now = useNow();
  const week = weekRange(now);
  const [selected, setSelected] = useState<ActivityType>('walking');
  const [busyDialog, setBusyDialog] = useState(false);

  const q = useDbQuery(
    async (db) => {
      const [weekWorkouts, recent, session] = await Promise.all([listWorkouts(db, week), listRecentWorkouts(db, 3), getSession(db)]);
      return { weekWorkouts, recent, session };
    },
    [week.from],
  );

  const start = () => {
    if (q.data?.session) {
      setBusyDialog(true);
      return;
    }
    router.push(`/timer?type=${selected}`);
  };

  const title = <PageTitle title="Find your movement" subtitle="Every session is a step forward." />;
  if (q.status === 'loading') {
    return (
      <Screen bottomInset={false}>
        {title}
        <LoadingState label="Loading your workouts…" />
      </Screen>
    );
  }
  if (q.status === 'error') {
    return (
      <Screen bottomInset={false}>
        {title}
        <ErrorCard title="Workouts didn't load." message="We couldn't read your workouts from this device." onRetry={q.reload} />
      </Screen>
    );
  }

  const { weekWorkouts, recent, session } = q.data;
  const minutes = Math.round(weekWorkouts.reduce((s, w) => s + w.durationSeconds, 0) / 60);
  const kcal = weekWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);

  return (
    <Screen bottomInset={false}>
      {title}
      <Pill label={`THIS WEEK · ${formatRange(week).replace(/, \d{4}$/, '').toUpperCase()}`} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatCard compact value={String(weekWorkouts.length)} label="Workouts" />
        <StatCard compact value={String(minutes)} unit="min" label="Duration" />
        <StatCard compact value={formatInt(kcal)} unit="kcal" label="Est. energy" />
      </View>

      <SectionHeader title="Choose your workout" />
      <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel="Workout type">
        {ACTIVITY_TYPES.map((t) => (
          <OptionCard key={t} label={ACTIVITY_INFO[t].label} icon={ACTIVITY_ICON[t]} selected={selected === t} onPress={() => setSelected(t)} />
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <AppText variant="captionRegular" color="textSecondary">
          Selected: {ACTIVITY_INFO[selected].label}
        </AppText>
        <Button label="Start Workout" icon={Play} onPress={start} />
        <Button label="Log a Past Activity" icon={Plus} variant="text" onPress={() => router.push('/log')} />
      </View>

      <SectionHeader title="Workout history" actionLabel={recent.length > 0 ? 'View all' : undefined} onAction={() => router.push('/history')} />
      {recent.length === 0 ? (
        <EmptyHistory onStart={start} onLog={() => router.push('/log')} />
      ) : (
        <View>
          {recent.map((w) => (
            <HistoryRow key={w.id} icon={ACTIVITY_ICON[w.activityType]} {...workoutRowText(w, now)} onPress={() => router.push(`/history?selected=${w.id}`)} />
          ))}
        </View>
      )}
      <Footnote>Calories are estimates based on activity, duration and your profile. Weekly active time also includes everyday movement.</Footnote>

      <Dialog visible={busyDialog} onClose={() => setBusyDialog(false)}>
        <AppText variant="heading">A workout is already open.</AppText>
        <AppText color="textSecondary">
          {session ? `Your ${ACTIVITY_INFO[session.activityType].label.toLowerCase()} session` : 'Your current session'} is still {session?.status === 'finished' ? 'waiting to be saved' : 'running'}. Finish or save it before starting another.
        </AppText>
        <Button
          label={session?.status === 'finished' ? 'Review Workout' : 'Return to Workout'}
          onPress={() => {
            setBusyDialog(false);
            router.push(session?.status === 'finished' ? '/summary' : '/timer');
          }}
        />
        <Button label="Cancel" variant="secondary" onPress={() => setBusyDialog(false)} />
      </Dialog>
    </Screen>
  );
}
