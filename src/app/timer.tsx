import { useLocalSearchParams, useRouter } from 'expo-router';
import { Activity, Circle, Pause, Play, Square } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { StatCard } from '@/components/cards/data';
import { ProgressRing } from '@/components/charts/charts';
import { AppText } from '@/components/common/AppText';
import { LoadingState } from '@/components/common/feedback';
import { BackHeader, Footnote, PageTitle, Pill, Screen } from '@/components/common/layout';
import { ACTIVITY_INFO, isActivityType, type ActivityType } from '@/domain/activityTypes';
import { estimateWorkoutCalories, estimateWorkoutDistanceM } from '@/domain/calories';
import { distanceValue, formatInt, formatPercent } from '@/domain/format';
import { elapsedMs, formatClock } from '@/domain/timer';
import { DEFAULT_SESSION_GOAL_SECONDS, useWorkoutSession } from '@/features/workouts/useWorkoutSession';
import { useAppData, useProfile } from '@/state/AppDataProvider';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Re-renders while running. The displayed time is always derived from stored timestamps
 * (`elapsedMs`); this clock only decides how often we re-read it. When paused or ready the
 * elapsed value doesn't depend on `now` at all.
 */
function useTicker(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [active]);
  return now;
}

/** 11 Timer Ready · 12 Timer Active · 13 Timer Paused */
export default function TimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const profile = useProfile();
  const { settings } = useAppData();
  const { colors } = useTheme();
  const { session, loaded, start, pause, resume, finish } = useWorkoutSession();
  const [busy, setBusy] = useState(false);
  const now = useTicker(session?.status === 'running');

  useEffect(() => {
    if (session?.status === 'finished') router.replace('/summary');
  }, [session?.status, router]);

  if (!loaded) {
    return (
      <Screen>
        <LoadingState label="Restoring your session…" />
      </Screen>
    );
  }

  const type: ActivityType = session?.activityType ?? (params.type && isActivityType(params.type) ? params.type : 'walking');
  const info = ACTIVITY_INFO[type];
  const goalSeconds = session?.goalSeconds ?? DEFAULT_SESSION_GOAL_SECONDS;
  const ms = session ? elapsedMs(session, now) : 0;
  const seconds = Math.floor(ms / 1000);
  const ratio = seconds / goalSeconds;
  const kcal = estimateWorkoutCalories(type, seconds, profile.weightKg);
  const distM = estimateWorkoutDistanceM(type, seconds);
  const dist = distM !== null ? distanceValue(distM, settings.measurementUnit) : null;
  const status = session?.status ?? 'ready';

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const ringColor = status === 'paused' ? colors.paused : colors.primary;
  const caption = status === 'ready' ? 'READY WHEN YOU ARE' : status === 'paused' ? 'TIMER PAUSED' : 'ELAPSED TIME';
  const subtitle = status === 'ready' ? 'A fresh start. Make it yours.' : status === 'paused' ? 'Take a breath. Your progress is safe.' : 'Stay in your rhythm.';

  return (
    <Screen>
      {status === 'ready' ? <BackHeader title={info.label} subtitle={subtitle} /> : <PageTitle title={info.label} subtitle={subtitle} />}
      <View style={{ alignItems: 'center', gap: 20 }}>
        {status === 'ready' ? (
          <Pill icon={Circle} label="Ready to start" />
        ) : status === 'paused' ? (
          <Pill icon={Pause} label="Paused · values frozen" />
        ) : (
          <Pill icon={Activity} label="Workout in progress" />
        )}
        <ProgressRing size={280} strokeWidth={6} ratio={status === 'ready' ? 0 : ratio} color={ringColor} trackColor={colors.track} accessibilityLabel={`${caption.toLowerCase()} ${formatClock(ms)}`}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            {status === 'paused' ? <Pause size={28} color={colors.primary} strokeWidth={1.4} /> : <Activity size={28} color={colors.primary} strokeWidth={1.4} />}
            <AppText variant="timer" accessibilityLiveRegion="none">
              {formatClock(ms)}
            </AppText>
            <AppText variant="overline" color="textSecondary">
              {caption}
            </AppText>
          </View>
        </ProgressRing>
        <AppText color="textSecondary">
          {status === 'ready'
            ? `Session goal · ${Math.round(goalSeconds / 60)} minutes`
            : `${formatClock(ms)} / ${formatClock(goalSeconds * 1000)} · ${formatPercent(ratio * 100)} complete`}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard value={formatInt(kcal)} unit="kcal" label="Estimated energy" />
        {dist ? (
          <StatCard value={dist.value} unit={dist.unit} label={status === 'ready' ? 'Session distance' : 'Est. distance'} />
        ) : (
          <StatCard value={String(Math.floor(seconds / 60))} unit="min" label="Active minutes" />
        )}
      </View>

      {status === 'ready' ? (
        <>
          <Button label="Start" icon={Play} loading={busy} onPress={() => void run(() => start(type))} />
          <Button label="Change Activity" variant="text" onPress={() => router.back()} />
          <Footnote align="center">The timer starts only when you tap Start. Calorie estimates use your activity and profile.</Footnote>
        </>
      ) : (
        <>
          {status === 'running' ? (
            <Button label="Pause" icon={Pause} loading={busy} onPress={() => void run(pause)} />
          ) : (
            <Button label="Resume" icon={Play} loading={busy} onPress={() => void run(resume)} />
          )}
          <Button label="Finish Workout" icon={Square} variant="secondary" disabled={busy} onPress={() => void run(finish)} />
          <Footnote align="center">
            {status === 'paused'
              ? 'Time and estimates remain unchanged until you resume.'
              : 'Keeps counting if you leave the app. Estimates are not medical measurements.'}
          </Footnote>
        </>
      )}
    </Screen>
  );
}
