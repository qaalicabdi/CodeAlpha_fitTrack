import { useRouter } from 'expo-router';
import { Bell, ChartNoAxesColumnIncreasing, Flame, Footprints, Play, Plus, Route, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { HistoryRow, SettingsRow, StatCard } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { Avatar } from '@/components/common/Avatar';
import { EmptyHistory, ErrorCard, LoadingState } from '@/components/common/feedback';
import { Card, Screen, SectionHeader } from '@/components/common/layout';
import { BottomSheet } from '@/components/dialogs/overlays';
import { Switch } from '@/components/inputs/selection';
import { StepRing } from '@/components/progress/StepRing';
import { ACTIVITY_ICON } from '@/constants/icons';
import { getSession } from '@/database/repositories/sessionRepository';
import { listRecentWorkouts } from '@/database/repositories/workoutsRepository';
import { ACTIVITY_INFO } from '@/domain/activityTypes';
import { formatLongDate, formatRange, greetingFor, toDateKey, weekRange } from '@/domain/dates';
import { distanceValue, formatInt } from '@/domain/format';
import { firstName } from '@/domain/profile';
import { elapsedMs, formatClock } from '@/domain/timer';
import { WeekBarsCard } from '@/features/dashboard/WeekStepsCard';
import { workoutRowText } from '@/features/history/workoutText';
import { useNow } from '@/hooks/useNow';
import { getDaySummary, getRangeDays } from '@/services/activityService';
import { useAppData, useDbQuery, useProfile } from '@/state/AppDataProvider';
import { useStepTracking } from '@/state/StepTrackingProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** 07 Home Dashboard */
export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const { goals, settings, updateSettings } = useAppData();
  const tracking = useStepTracking();
  const { colors } = useTheme();
  const now = useNow();
  const today = toDateKey(now);
  const week = weekRange(now);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const q = useDbQuery(
    async (db) => {
      const [day, days, recent, session] = await Promise.all([
        getDaySummary(db, today, profile),
        getRangeDays(db, week),
        listRecentWorkouts(db, 3),
        getSession(db),
      ]);
      return { day, days, recent, session };
    },
    [today, profile.weightKg, profile.heightCm],
  );

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
        <Avatar name={profile.fullName} uri={profile.photoUri} size={44} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <AppText variant="captionRegular" color="textSecondary">
          {formatLongDate(now)}
        </AppText>
        <AppText variant="subheading" accessibilityRole="header">
          {greetingFor(now)}, {firstName(profile.fullName)}!
        </AppText>
      </View>
      <Pressable onPress={() => setNotificationsOpen(true)} accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={22} color={colors.text} strokeWidth={1.6} />
      </Pressable>
    </View>
  );

  if (q.status === 'loading') {
    return (
      <Screen bottomInset={false}>
        <LoadingState />
      </Screen>
    );
  }
  if (q.status === 'error') {
    return (
      <Screen bottomInset={false}>
        {header}
        <ErrorCard title="Your dashboard didn't load." message="We couldn't read your local activity. Your data has not been changed." onRetry={q.reload} />
      </Screen>
    );
  }

  const { day, days, recent, session } = q.data;
  const t = day.totals;
  const goal = goals.daily_steps;
  const remaining = Math.max(0, goal - t.steps);
  const dist = distanceValue(t.distanceM, settings.measurementUnit);
  const weekTotal = days.reduce((s, d) => s + d.steps, 0);
  const trackingLabel = tracking.status === 'enabled' ? 'Tracking enabled' : tracking.status === 'checking' ? 'Checking tracking…' : 'Step tracking off';

  return (
    <Screen bottomInset={false}>
      {header}

      {session ? (
        <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
          <Timer size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">
              {session.status === 'finished' ? 'Workout not saved yet' : session.status === 'paused' ? 'Workout paused' : 'Workout in progress'}
            </AppText>
            <AppText variant="captionRegular" color="textSecondary">
              {ACTIVITY_INFO[session.activityType].label} · {formatClock(elapsedMs(session, now.getTime()))}
            </AppText>
          </View>
          <Button
            label={session.status === 'finished' ? 'Review' : 'Resume'}
            size="medium"
            onPress={() => router.push(session.status === 'finished' ? '/summary' : '/timer')}
          />
        </Card>
      ) : null}

      <Card tone="hero" style={{ alignItems: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="leadRegular" color="onSecondary">
            Your daily stride
          </AppText>
          <Pressable onPress={() => router.push('/activity')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tracking.status === 'enabled' ? colors.accent : colors.onSecondaryMuted }} />
            <AppText variant="caption" style={{ color: tracking.status === 'enabled' ? colors.accent : colors.onSecondaryMuted }}>
              {trackingLabel}
            </AppText>
          </Pressable>
        </View>
        <StepRing steps={t.steps} goal={goal} tone="hero" />
        <AppText variant="bodyStrong" color="onSecondary">
          {remaining > 0 ? `${formatInt(remaining)} steps to your goal` : 'Daily step goal reached'}
        </AppText>
        <AppText variant="captionRegular" color="onSecondaryMuted" align="center">
          {tracking.status === 'enabled' || day.hasStepData ? 'A little movement. A stronger everyday.' : 'Turn on step tracking in Activity to fill your ring automatically.'}
        </AppText>
      </Card>

      <SectionHeader title="Today at a glance" />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={Footprints} value={formatInt(t.steps)} label="Steps" />
          <StatCard icon={Route} value={dist.value} unit={dist.unit} label="Distance" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={Flame} value={formatInt(t.activityEnergy)} unit="kcal" label="Activity energy" />
          <StatCard icon={Timer} value={String(t.activeMinutes)} unit="min" label="Active time" />
        </View>
      </View>

      <WeekBarsCard
        title="Your week in steps"
        headline={formatInt(weekTotal)}
        headlineCaption={`${formatRange(week).replace(/, \d{4}$/, '')} · week so far`}
        axisLabel={`${formatInt(goal / 1000)}k steps`}
        days={days}
        today={today}
        value={(d) => d.steps}
        max={goal}
        onViewAll={() => router.push('/progress?period=weekly')}
      />

      <SectionHeader title="Make your next move" />
      <View style={{ gap: 12 }}>
        <Button label="Start Workout" icon={Play} onPress={() => router.push('/workout')} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button style={{ flex: 1 }} label="Log Activity" icon={Plus} variant="secondary" onPress={() => router.push('/log')} />
          <Button style={{ flex: 1 }} label="View Progress" icon={ChartNoAxesColumnIncreasing} variant="secondary" onPress={() => router.push('/progress')} />
        </View>
      </View>

      <SectionHeader title="Recent workouts" actionLabel={recent.length > 0 ? 'See history' : undefined} onAction={() => router.push('/history')} />
      {recent.length === 0 ? (
        <EmptyHistory onStart={() => router.push('/workout')} onLog={() => router.push('/log')} />
      ) : (
        <View>
          {recent.map((w) => {
            const text = workoutRowText(w, now);
            return <HistoryRow key={w.id} icon={ACTIVITY_ICON[w.activityType]} {...text} onPress={() => router.push(`/history?selected=${w.id}`)} />;
          })}
        </View>
      )}

      <BottomSheet visible={notificationsOpen} title="Notifications" onClose={() => setNotificationsOpen(false)}>
        <AppText color="textSecondary">You’re all caught up. FITTRACK keeps everything on this device and never sends your data anywhere.</AppText>
        <Card padded={false}>
          <SettingsRow
            icon={Bell}
            label="Goal reminders"
            sublabel={settings.notificationsEnabled ? 'On' : 'Off'}
            right={<Switch value={settings.notificationsEnabled} onChange={(v) => void updateSettings({ notificationsEnabled: v })} accessibilityLabel="Goal reminders" />}
          />
        </Card>
      </BottomSheet>
    </Screen>
  );
}
