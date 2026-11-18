import { useRouter } from 'expo-router';
import { Activity as Pulse, Plus, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { HistoryRow, StatCard } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { ErrorCard, LoadingState } from '@/components/common/feedback';
import { Card, Footnote, PageTitle, Pill, Screen, SectionHeader } from '@/components/common/layout';
import { StepRing } from '@/components/progress/StepRing';
import { ACTIVITY_ICON } from '@/constants/icons';
import { formatLongDate, formatTime, toDateKey } from '@/domain/dates';
import { distanceValue, formatInt } from '@/domain/format';
import {
  PermissionDeniedCard,
  PermissionNeededCard,
  PrePermissionSheet,
  TrackingUnavailableCard,
} from '@/features/activity/PermissionStates';
import { HourlyCard } from '@/features/activity/HourlyCard';
import { workoutRowText } from '@/features/history/workoutText';
import { useNow } from '@/hooks/useNow';
import { getDaySummary } from '@/services/activityService';
import { useAppData, useDbQuery, useProfile } from '@/state/AppDataProvider';
import { useStepTracking } from '@/state/StepTrackingProvider';

/** 08 Activity Tracking Enabled / 09 Activity Permission Needed */
export default function ActivityScreen() {
  const router = useRouter();
  const profile = useProfile();
  const { goals, settings } = useAppData();
  const tracking = useStepTracking();
  const now = useNow();
  const today = toDateKey(now);
  const [sheet, setSheet] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const q = useDbQuery((db) => getDaySummary(db, today, profile), [today, profile.weightKg, profile.heightCm]);

  const enable = async () => {
    setSheet(false);
    setRequesting(true);
    try {
      await tracking.enable();
    } finally {
      setRequesting(false);
    }
  };

  const log = () => router.push('/log');
  const title = <PageTitle title="Activity" subtitle={formatLongDate(now)} />;

  if (q.status === 'loading' || tracking.status === 'checking') {
    return (
      <Screen bottomInset={false}>
        {title}
        <LoadingState />
      </Screen>
    );
  }
  if (q.status === 'error') {
    return (
      <Screen bottomInset={false}>
        {title}
        <ErrorCard title="Activity didn't load." message="We couldn't read today's activity from this device." onRetry={q.reload} />
      </Screen>
    );
  }

  const day = q.data;
  const showData = tracking.status === 'enabled' || day.hasStepData;

  if (!showData) {
    return (
      <Screen bottomInset={false}>
        {title}
        <Pill icon={ShieldCheck} label="Step tracking is off" />
        {tracking.status === 'denied' ? (
          <PermissionDeniedCard onOpenSettings={() => void tracking.openSettings()} onLog={log} />
        ) : tracking.status === 'unavailable' ? (
          <TrackingUnavailableCard onLog={log} />
        ) : (
          <PermissionNeededCard onEnable={() => setSheet(true)} onLog={log} busy={requesting} />
        )}
        <PrePermissionSheet
          visible={sheet}
          onClose={() => setSheet(false)}
          onContinue={() => void enable()}
          onManual={() => {
            setSheet(false);
            log();
          }}
        />
      </Screen>
    );
  }

  const t = day.totals;
  const dist = distanceValue(t.distanceM, settings.measurementUnit);
  const remaining = Math.max(0, goals.daily_steps - t.steps);
  const updated = tracking.lastSyncedAt ? `Updated ${formatTime(tracking.lastSyncedAt)}` : '';
  const sourceCaption =
    tracking.status !== 'enabled'
      ? 'Showing steps recorded earlier · tracking is currently off'
      : tracking.liveOnly
        ? `${tracking.providerName ?? 'Device sensor'} · counts while FITTRACK is open`
        : `${tracking.providerName ?? 'Device'} data`;

  return (
    <Screen bottomInset={false}>
      {title}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pill icon={ShieldCheck} label={tracking.status === 'enabled' ? 'Tracking enabled' : 'Step tracking is off'} />
        <AppText variant="captionRegular" color="textSecondary">
          {updated}
        </AppText>
      </View>

      <Card style={{ alignItems: 'center', gap: 14 }}>
        <StepRing steps={t.steps} goal={goals.daily_steps} tone="surface" />
        <AppText variant="bodyStrong" color="primaryText">
          {remaining > 0 ? `${formatInt(remaining)} steps remaining` : 'Daily goal reached'}
        </AppText>
        <AppText variant="captionRegular" color="textSecondary" align="center">
          {sourceCaption}
        </AppText>
      </Card>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard value={dist.value} unit={dist.unit} label="Distance" />
        <StatCard value={formatInt(t.activityEnergy)} unit="kcal" label="Activity energy" />
      </View>

      <HourlyCard title="Movement by hour" hourly={day.hourly} currentHour={now.getHours()} isToday />

      <SectionHeader title="Your day in motion" />
      <View style={{ gap: 12 }}>
        {day.workouts.map((w) => {
          const text = workoutRowText(w, now);
          return <HistoryRow key={w.id} plain icon={ACTIVITY_ICON[w.activityType]} title={text.title} subtitle={text.subtitle} meta={formatTime(new Date(w.startTime))} />;
        })}
        {t.everydaySteps > 0 ? (
          <HistoryRow
            plain
            icon={Pulse}
            title="Everyday movement"
            subtitle={`${t.everydayActiveMinutes} active min · ${formatInt(t.everydaySteps)} steps`}
            meta={updated || 'Today'}
          />
        ) : null}
        {day.workouts.length === 0 && t.everydaySteps === 0 ? (
          <Card>
            <AppText color="textSecondary">No movement recorded yet today. Steps appear here as your device reports them.</AppText>
          </Card>
        ) : null}
      </View>

      <Button label="Log Activity Manually" icon={Plus} variant="secondary" onPress={log} />
      <Button label="View history" variant="text" onPress={() => router.push('/history')} />
      <Footnote>Activity energy includes all movement today. Workout estimates are part of this total, not added twice.</Footnote>
    </Screen>
  );
}
