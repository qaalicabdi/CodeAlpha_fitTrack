import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Pencil } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { StatCard } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { ErrorCard, LoadingState, SuccessBanner } from '@/components/common/feedback';
import { BackHeader, Card, Footnote, Pill, Screen } from '@/components/common/layout';
import { BottomSheet } from '@/components/dialogs/overlays';
import { DateTimeField } from '@/components/inputs/DateTimeField';
import { Input, SelectField } from '@/components/inputs/Input';
import { OptionCard } from '@/components/inputs/selection';
import { ACTIVITY_ICON } from '@/constants/icons';
import { getWorkout, listWorkouts } from '@/database/repositories/workoutsRepository';
import { ACTIVITY_INFO, ACTIVITY_TYPES, type ActivityType } from '@/domain/activityTypes';
import { estimateWorkoutCalories } from '@/domain/calories';
import { formatFullDate, formatMonthDay, formatTime, isSameDay, toDateKey, weekRange } from '@/domain/dates';
import { distanceValue, formatInt } from '@/domain/format';
import { parseDurationMinutes, validateManualEntry, type ManualEntryErrors } from '@/domain/manualEntry';
import { newClientId } from '@/features/workouts/useWorkoutSession';
import { editManualActivity, getDaySummary, getRangeDays, saveManualActivity } from '@/services/activityService';
import { useAppData, useProfile } from '@/state/AppDataProvider';
import type { SqlDatabase } from '@/database/types';
import type { UserProfile } from '@/domain/profile';

function defaultStart(now: Date): Date {
  const d = new Date(now.getTime() - 30 * 60_000);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

function combine(date: Date, time: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0);
}

interface Snapshot {
  energy: number;
  activeMinutes: number;
  steps: number;
  distanceM: number;
  weeklyWorkouts: number;
  weeklyMinutes: number;
}

async function snapshot(db: SqlDatabase, profile: UserProfile, date: Date): Promise<Snapshot> {
  const week = weekRange(date);
  const [day, days, workouts] = await Promise.all([getDaySummary(db, toDateKey(date), profile), getRangeDays(db, week), listWorkouts(db, week)]);
  return {
    energy: day.totals.activityEnergy,
    activeMinutes: day.totals.activeMinutes,
    steps: day.totals.steps,
    distanceM: day.totals.distanceM,
    weeklyWorkouts: workouts.length,
    weeklyMinutes: days.reduce((s, d) => s + d.activeMinutes, 0),
  };
}

type Phase = { kind: 'form' } | { kind: 'saving' } | { kind: 'error' } | { kind: 'saved'; before: Snapshot; after: Snapshot; start: Date; type: ActivityType; minutes: number; kcal: number };

/** 14 Manual Activity Logging (also edits manual entries: /log?id=123) */
export default function LogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : null;
  const profile = useProfile();
  const { db, settings, invalidate } = useAppData();
  const clientId = useRef(newClientId('manual')).current;
  const now = useMemo(() => new Date(), []);

  const [type, setType] = useState<ActivityType>('walking');
  const [date, setDate] = useState(() => defaultStart(now));
  const [time, setTime] = useState(() => defaultStart(now));
  const [duration, setDuration] = useState('30');
  const [calories, setCalories] = useState('');
  const [overridden, setOverridden] = useState(false);
  const [errors, setErrors] = useState<ManualEntryErrors>({});
  const [typeSheet, setTypeSheet] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [loadingEdit, setLoadingEdit] = useState(editId !== null);
  const [editBlocked, setEditBlocked] = useState(false);

  // Edit mode: load the existing manual entry.
  useEffect(() => {
    if (editId === null) return;
    getWorkout(db, editId).then((w) => {
      if (!w || w.source !== 'manual') setEditBlocked(true);
      else {
        const start = new Date(w.startTime);
        setType(w.activityType);
        setDate(start);
        setTime(start);
        setDuration(String(Math.round(w.durationSeconds / 60)));
        setCalories(String(Math.round(w.caloriesBurned)));
        setOverridden(w.caloriesManuallyAdjusted);
      }
      setLoadingEdit(false);
    });
  }, [db, editId]);

  const minutes = parseDurationMinutes(duration);
  const estimate = minutes !== null ? estimateWorkoutCalories(type, minutes * 60, profile.weightKg) : null;
  const caloriesText = overridden ? calories : estimate !== null ? String(estimate) : '';

  const save = async () => {
    const start = combine(date, time);
    const result = validateManualEntry({ durationText: duration, caloriesText, caloriesOverridden: overridden, start, now: new Date() });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setPhase({ kind: 'saving' });
    const input = { activityType: type, start, durationMinutes: result.durationMinutes, caloriesOverride: result.caloriesOverride };
    try {
      if (editId !== null) {
        await editManualActivity(db, editId, input, profile);
        invalidate();
        router.back();
        return;
      }
      const before = await snapshot(db, profile, start);
      await saveManualActivity(db, clientId, input, profile);
      const after = await snapshot(db, profile, start);
      invalidate();
      setPhase({ kind: 'saved', before, after, start, type, minutes: result.durationMinutes, kcal: result.caloriesOverride ?? estimate ?? 0 });
    } catch {
      setPhase({ kind: 'error' });
    }
  };

  if (loadingEdit) {
    return (
      <Screen>
        <LoadingState label="Loading activity…" />
      </Screen>
    );
  }

  if (editBlocked) {
    return (
      <Screen>
        <BackHeader title="Edit activity" />
        <Card style={{ gap: 12 }}>
          <AppText variant="lead">This entry can’t be edited.</AppText>
          <AppText color="textSecondary">Only manually logged activities can be changed. Timer sessions and device-recorded data are kept as recorded.</AppText>
          <Button label="Back" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  if (phase.kind === 'saved') {
    return <SavedFeedback phase={phase} unit={settings.measurementUnit} onHome={() => router.replace('/(tabs)')} onView={() => router.navigate('/history')} />;
  }

  const startDate = combine(date, time);
  const dayHint = isSameDay(startDate, now) ? 'Today' : undefined;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader title={editId !== null ? 'Edit activity' : 'Log an activity'} subtitle="Your effort counts, however you record it." />
        <Pill icon={Pencil} label="Manual entry" />

        <SelectField label="Activity type" value={ACTIVITY_INFO[type].label} onPress={() => setTypeSheet(true)} />
        <DateTimeField label="Date" mode="date" value={date} display={formatFullDate(date)} hint={dayHint} onChange={setDate} maximumDate={now} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateTimeField style={{ flex: 1 }} label="Start time" mode="time" value={time} display={formatTime(time)} onChange={setTime} error={errors.start} />
          <Input
            style={{ flex: 1 }}
            label="Duration"
            required={!!errors.duration}
            value={duration}
            onChangeText={(v) => setDuration(v.replace(/[^\d]/g, ''))}
            suffix="min"
            keyboardType="number-pad"
            maxLength={3}
            placeholder="Enter value"
            error={errors.duration}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Input
            label="Calories"
            value={minutes === null && !overridden ? '—' : caloriesText}
            onChangeText={(v) => {
              setOverridden(true);
              setCalories(v.replace(/[^\d]/g, ''));
            }}
            suffix="kcal"
            keyboardType="number-pad"
            maxLength={4}
            disabled={minutes === null && !overridden}
            error={errors.calories}
            helper={
              minutes === null && !overridden
                ? 'Estimate available after a valid duration.'
                : overridden
                  ? `Your value · estimate is ${estimate !== null ? formatInt(estimate) : '—'} kcal`
                  : 'Estimated automatically · editable override'
            }
          />
          {overridden ? (
            <Pressable onPress={() => setOverridden(false)} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
              <AppText variant="label" color="primaryText">
                Use the estimate instead
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <Card style={{ gap: 10 }}>
          <AppText variant="bodyStrong">An estimate, not a measurement.</AppText>
          <AppText color="textSecondary">
            We use your activity type, {minutes !== null ? `${minutes}-minute duration` : 'duration'} and {Math.round(profile.weightKg)} kg profile to estimate energy. Adjust the calories above if you have a more accurate figure.
          </AppText>
          <AppText variant="captionRegular" color="primaryText">
            Saved entries are labelled “Manual”.
          </AppText>
        </Card>

        {phase.kind === 'error' ? (
          <ErrorCard
            title="Activity wasn't saved."
            message={`We couldn't write to local storage. Your ${ACTIVITY_INFO[type].label} entry is still here: ${duration} min, ${caloriesText || '—'} kcal. Free some device space, then try again.`}
            onRetry={() => void save()}
            retryLabel="Retry Save"
            secondary={{ label: 'Keep Editing', onPress: () => setPhase({ kind: 'form' }) }}
          />
        ) : (
          <Button label={editId !== null ? 'Save Changes' : 'Save Activity'} icon={Check} onPress={() => void save()} loading={phase.kind === 'saving'} />
        )}
        <Button label="Cancel" variant="text" onPress={() => router.back()} />
        <Footnote>Stored on this device. You can edit or delete manual entries in Activity History.</Footnote>

        <BottomSheet visible={typeSheet} title="Activity type" onClose={() => setTypeSheet(false)}>
          {ACTIVITY_TYPES.map((t) => (
            <OptionCard
              key={t}
              label={ACTIVITY_INFO[t].label}
              icon={ACTIVITY_ICON[t]}
              selected={type === t}
              onPress={() => {
                setType(t);
                setTypeSheet(false);
              }}
            />
          ))}
        </BottomSheet>
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Supporting state 10 — saved feedback / updated dashboard. */
function SavedFeedback({
  phase,
  unit,
  onHome,
  onView,
}: {
  phase: Extract<Phase, { kind: 'saved' }>;
  unit: 'metric' | 'imperial';
  onHome: () => void;
  onView: () => void;
}) {
  const { before, after } = phase;
  const goals = useAppData().goals;
  const dist = distanceValue(after.distanceM, unit);
  const isToday = isSameDay(phase.start, new Date());
  const dayLabel = isToday ? 'today' : formatMonthDay(phase.start);
  return (
    <Screen>
      <SuccessBanner
        title="Activity saved on this device"
        detail={`${ACTIVITY_INFO[phase.type].label} · ${formatMonthDay(phase.start)}, ${formatTime(phase.start)} · ${phase.minutes} min · ${formatInt(phase.kcal)} kcal`}
      />
      <AppText variant="heading">{isToday ? 'Your updated dashboard' : `Updated totals for ${dayLabel}`}</AppText>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard value={formatInt(after.energy)} unit="kcal" label={`${formatInt(before.energy)} + ${formatInt(after.energy - before.energy)} activity energy`} />
        <StatCard value={String(after.activeMinutes)} unit="min" label={`${before.activeMinutes} + ${after.activeMinutes - before.activeMinutes} active minutes`} />
      </View>
      <View style={{ gap: 6 }}>
        <AppText color="textSecondary">
          Weekly workouts: {after.weeklyWorkouts} / {goals.weekly_workouts}
          {after.weeklyWorkouts >= goals.weekly_workouts ? ' ✓' : ''}
        </AppText>
        <AppText color="textSecondary">
          Weekly active minutes: {formatInt(after.weeklyMinutes)} / {formatInt(goals.weekly_active_minutes)}
        </AppText>
        <AppText color="textSecondary">
          Steps stay {formatInt(after.steps)} / {formatInt(goals.daily_steps)}; distance stays {dist.value} {dist.unit}.
        </AppText>
      </View>
      <Button label="Back to Dashboard" onPress={onHome} />
      <Button label="View Activity" variant="secondary" onPress={onView} />
    </Screen>
  );
}
