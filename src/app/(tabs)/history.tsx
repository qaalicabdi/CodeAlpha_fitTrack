import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { HistoryRow } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { EmptyHistory, ErrorCard, LoadingState } from '@/components/common/feedback';
import { BackHeader, Card, Screen, SectionHeader } from '@/components/common/layout';
import { BottomSheet, Dialog } from '@/components/dialogs/overlays';
import { SelectField } from '@/components/inputs/Input';
import { FilterChip } from '@/components/inputs/selection';
import { ACTIVITY_ICON } from '@/constants/icons';
import { getWorkout, listWorkouts, type Workout } from '@/database/repositories/workoutsRepository';
import { HISTORY_FILTER_LABEL, HISTORY_FILTERS, typesForFilter, type HistoryFilter } from '@/domain/activityTypes';
import { formatMonthDay, formatMonthYear, formatTime, monthName, monthRange, startOfMonth } from '@/domain/dates';
import { formatInt, formatMinutes, pluralize } from '@/domain/format';
import { workoutRowText } from '@/features/history/workoutText';
import { useNow } from '@/hooks/useNow';
import { deleteManualActivity } from '@/services/activityService';
import { useAppData, useDbQuery, useProfile } from '@/state/AppDataProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** 20 Activity History */
export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selected?: string }>();
  const profile = useProfile();
  const { db, invalidate } = useAppData();
  const { colors, radii } = useTheme();
  const now = useNow();
  const [month, setMonth] = useState(() => startOfMonth(now));
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(params.selected ? Number(params.selected) : null);
  const [monthSheet, setMonthSheet] = useState(false);
  const [draftMonth, setDraftMonth] = useState(month);
  const [confirm, setConfirm] = useState<Workout | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Deep link from Home/Workout (the tab stays mounted, so follow param changes).
  const [lastParam, setLastParam] = useState(params.selected);
  if (params.selected !== lastParam) {
    setLastParam(params.selected);
    if (params.selected) setSelectedId(Number(params.selected));
  }
  useEffect(() => {
    if (!params.selected) return;
    let alive = true;
    getWorkout(db, Number(params.selected)).then((w) => {
      if (alive && w) setMonth(startOfMonth(new Date(w.startTime)));
    });
    return () => {
      alive = false;
    };
  }, [db, params.selected]);

  const range = monthRange(month);
  const q = useDbQuery(
    async (d) => {
      const [filtered, any] = await Promise.all([listWorkouts(d, range, typesForFilter(filter)), listWorkouts(d, { from: '0000-01-01', to: '9999-12-31' }, undefined, 1)]);
      return { workouts: filtered, hasAny: any.length > 0 };
    },
    [range.from, filter],
  );

  const selected = q.data?.workouts.find((w) => w.id === selectedId) ?? null;

  const doDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      await deleteManualActivity(db, confirm.id, profile);
      invalidate();
      setConfirm(null);
      setSelectedId(null);
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  const draftIsCurrent = draftMonth.getFullYear() === now.getFullYear() && draftMonth.getMonth() === now.getMonth();

  return (
    <Screen bottomInset={false}>
      <BackHeader title="Activity history" subtitle="A record of showing up." />
      <SelectField
        value={formatMonthYear(month)}
        onPress={() => {
          setDraftMonth(month);
          setMonthSheet(true);
        }}
        icon={<Calendar size={18} color={colors.primary} strokeWidth={1.6} />}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {HISTORY_FILTERS.map((f) => (
          <FilterChip key={f} label={HISTORY_FILTER_LABEL[f]} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {q.status === 'loading' ? (
        <LoadingState label="Loading your history…" />
      ) : q.status === 'error' ? (
        <ErrorCard title="History didn't load." message="We couldn't read your activities from this device." onRetry={q.reload} />
      ) : !q.data.hasAny ? (
        <EmptyHistory onStart={() => router.push('/workout')} onLog={() => router.push('/log')} />
      ) : (
        <>
          <SectionHeader
            title={monthName(month)}
            right={
              <AppText variant="captionRegular" color="textSecondary">
                {pluralize(q.data.workouts.length, 'workout', 'workouts')} · {formatMinutes(q.data.workouts.reduce((s, w) => s + w.durationSeconds, 0) / 60)}
              </AppText>
            }
          />
          {q.data.workouts.length === 0 ? (
            <Card>
              <AppText color="textSecondary">
                No {filter === 'all' ? '' : `${HISTORY_FILTER_LABEL[filter].toLowerCase()} `}activities in {formatMonthYear(month)}.
              </AppText>
            </Card>
          ) : (
            <View>
              {q.data.workouts.map((w) => (
                <HistoryRow
                  key={w.id}
                  icon={ACTIVITY_ICON[w.activityType]}
                  {...workoutRowText(w, now)}
                  selected={w.id === selectedId}
                  onPress={() => setSelectedId(w.id === selectedId ? null : w.id)}
                  onMenu={() => setSelectedId(w.id)}
                />
              ))}
            </View>
          )}

          {selected ? (
            <Card tone="tint" style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pencil size={18} color={colors.primary} />
                <AppText variant="bodyStrong">
                  {workoutRowText(selected, now).title} · {selected.source === 'manual' ? 'Manual entry' : 'Timer session'}
                </AppText>
              </View>
              <AppText color="textSecondary">
                Recorded {formatMonthDay(new Date(selected.startTime))} at {formatTime(new Date(selected.startTime))} · {formatMinutes(selected.durationSeconds / 60)} ·{' '}
                {formatInt(selected.caloriesBurned)} kcal{selected.caloriesManuallyAdjusted ? ' (your value)' : ' (estimated)'}.
                {selected.source === 'manual' ? ' Manage the entry below.' : ' Timer sessions keep their recorded values and can’t be edited.'}
              </AppText>
              {selected.source === 'manual' ? (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button style={{ flex: 1 }} label="Edit Activity" icon={Pencil} variant="secondary" onPress={() => router.push(`/log?id=${selected.id}`)} />
                  <Button style={{ flex: 1 }} label="Delete" icon={Trash2} variant="danger" onPress={() => setConfirm(selected)} />
                </View>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      <Button label="Log Activity" icon={Plus} onPress={() => router.push('/log')} />

      <BottomSheet visible={monthSheet} title="Choose month" onClose={() => setMonthSheet(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => setDraftMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            style={{ width: 48, height: 48, borderRadius: radii.control, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={20} color={colors.primary} />
          </Pressable>
          <AppText variant="lead" style={{ flex: 1, textAlign: 'center' }}>
            {formatMonthYear(draftMonth)}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            disabled={draftIsCurrent}
            onPress={() => setDraftMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            style={{ width: 48, height: 48, borderRadius: radii.control, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center', opacity: draftIsCurrent ? 0.4 : 1 }}
          >
            <ChevronRight size={20} color={colors.primary} />
          </Pressable>
        </View>
        <Button
          label="Apply"
          onPress={() => {
            setMonth(draftMonth);
            setSelectedId(null);
            setMonthSheet(false);
          }}
        />
        <Button label="Cancel" variant="secondary" onPress={() => setMonthSheet(false)} />
      </BottomSheet>

      <Dialog visible={confirm !== null} onClose={() => setConfirm(null)}>
        <Trash2 size={24} color={colors.error} strokeWidth={1.6} />
        <AppText variant="heading">Delete manual activity?</AppText>
        {confirm ? (
          <AppText color="textSecondary">
            {workoutRowText(confirm, now).title} · {formatMonthDay(new Date(confirm.startTime))}, {formatTime(new Date(confirm.startTime))} · {formatMinutes(confirm.durationSeconds / 60)} ·{' '}
            {formatInt(confirm.caloriesBurned)} kcal. Deleting removes this entry from your history and recalculates your totals. This cannot be undone.
          </AppText>
        ) : null}
        {deleteError ? <AppText color="errorText">The entry couldn’t be deleted. Please try again.</AppText> : null}
        <Button label="Delete Activity" variant="danger" onPress={() => void doDelete()} loading={deleting} />
        <Button label="Cancel" variant="secondary" onPress={() => setConfirm(null)} disabled={deleting} />
      </Dialog>
    </Screen>
  );
}
