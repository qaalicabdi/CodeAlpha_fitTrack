import { Dumbbell, Flame, Footprints, Pencil, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { GoalProgressRow } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { ErrorCard, LoadingState } from '@/components/common/feedback';
import { BackHeader, Card, Footnote, Pill, Screen, type IconComponent } from '@/components/common/layout';
import { BottomSheet } from '@/components/dialogs/overlays';
import { Input } from '@/components/inputs/Input';
import { FITNESS_GOAL_ICON } from '@/constants/icons';
import { formatRange, toDateKey, weekRange } from '@/domain/dates';
import { formatInt, formatPercent } from '@/domain/format';
import { GOAL_DEFINITIONS, GOAL_TYPES, goalProgress, validateGoalTarget, type GoalType } from '@/domain/goals';
import { FITNESS_GOAL_LABEL } from '@/domain/profile';
import { useNow } from '@/hooks/useNow';
import { getDaySummary, getRangeDays } from '@/services/activityService';
import { useAppData, useDbQuery, useProfile } from '@/state/AppDataProvider';
import { useTheme } from '@/theme/ThemeProvider';

const ICON: Record<GoalType, IconComponent> = {
  daily_steps: Footprints,
  weekly_workouts: Dumbbell,
  daily_energy: Flame,
  weekly_active_minutes: Timer,
};

function remainingText(type: GoalType, remaining: number): string {
  switch (type) {
    case 'daily_steps':
      return remaining > 0 ? `${formatInt(remaining)} steps remaining today` : 'Goal reached today';
    case 'weekly_workouts':
      return remaining > 0 ? `${remaining} workout${remaining === 1 ? '' : 's'} remaining this week` : 'Goal reached this week';
    case 'daily_energy':
      return remaining > 0 ? `${formatInt(remaining)} kcal remaining · estimated` : 'Goal reached today · estimated';
    case 'weekly_active_minutes':
      return remaining > 0 ? `${formatInt(remaining)} active minutes remaining` : 'Goal reached this week';
  }
}

/** 19 Goals Management (+ Edit Goal bottom sheet) */
export default function GoalsScreen() {
  const profile = useProfile();
  const { goals, setGoal } = useAppData();
  const { colors } = useTheme();
  const now = useNow();
  const today = toDateKey(now);
  const week = weekRange(now);
  const [editing, setEditing] = useState<GoalType | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const q = useDbQuery(
    async (db) => {
      const [day, days] = await Promise.all([getDaySummary(db, today, profile), getRangeDays(db, week)]);
      return {
        daily_steps: day.totals.steps,
        daily_energy: day.totals.activityEnergy,
        weekly_workouts: days.reduce((s, d) => s + d.workoutCount, 0),
        weekly_active_minutes: days.reduce((s, d) => s + d.activeMinutes, 0),
      } satisfies Record<GoalType, number>;
    },
    [today, week.from, profile.weightKg, profile.heightCm],
  );

  const openEditor = (type: GoalType) => {
    setEditing(type);
    setDraft(formatInt(goals[type]));
    setError(undefined);
  };

  const save = async () => {
    if (!editing) return;
    const v = validateGoalTarget(editing, draft);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    setSaving(true);
    try {
      await setGoal(editing, v.value);
      setEditing(null);
    } catch {
      setError("We couldn't save this goal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const GoalIcon = FITNESS_GOAL_ICON[profile.fitnessGoal];
  const def = editing ? GOAL_DEFINITIONS[editing] : null;
  const draftValue = editing ? validateGoalTarget(editing, draft) : null;
  const current = editing && q.status === 'success' ? q.data[editing] : null;

  return (
    <Screen bottomInset={false}>
      <BackHeader title="Goals that move you" subtitle="Make progress personal." />
      <Pill icon={GoalIcon} label={FITNESS_GOAL_LABEL[profile.fitnessGoal]} />
      <AppText color="textSecondary" variant="leadRegular" style={{ fontSize: 16 }}>
        A balanced set of targets for a stronger everyday. Adjust them as your routine evolves.
      </AppText>

      {q.status === 'loading' ? (
        <LoadingState label="Loading your goals…" />
      ) : q.status === 'error' ? (
        <ErrorCard title="Goals didn't load." message="We couldn't read your progress from this device." onRetry={q.reload} />
      ) : (
        GOAL_TYPES.map((type) => {
          const d = GOAL_DEFINITIONS[type];
          const p = goalProgress(q.data[type], goals[type]);
          const Icon = ICON[type];
          return (
            <Card key={type} style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Icon size={22} color={colors.primary} strokeWidth={1.5} />
                <Pressable
                  onPress={() => openEditor(type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${d.title} goal`}
                  hitSlop={10}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
                >
                  <Pencil size={14} color={colors.primaryText} />
                  <AppText variant="label" color="primaryText">
                    Edit Goal
                  </AppText>
                </Pressable>
              </View>
              <GoalProgressRow
                title={d.title}
                percentLabel={formatPercent(p.percent)}
                ratio={p.ratio}
                detail={`${formatInt(p.current)} / ${formatInt(p.target)} ${d.unit}`}
                extra={remainingText(type, p.remaining)}
              />
            </Card>
          );
        })
      )}
      <Footnote>
        Daily goals reset at midnight. Weekly goals run Monday–Sunday. Current week: {formatRange(week)}.
      </Footnote>

      <BottomSheet visible={editing !== null} title={def?.sheetTitle ?? ''} onClose={() => setEditing(null)}>
        {editing && def ? (
          <>
            <AppText color="textSecondary">
              Current target · {formatInt(goals[editing])} {def.unit}
            </AppText>
            <Input
              label={`New ${def.period === 'day' ? 'daily' : 'weekly'} target`}
              value={draft}
              onChangeText={(v) => {
                setDraft(v);
                setError(undefined);
              }}
              suffix={def.unit}
              keyboardType="number-pad"
              autoFocus
              error={error}
              helper={`Suggested range: ${formatInt(def.min)}–${formatInt(def.max)} ${def.unit}.`}
            />
            {draftValue?.ok && current !== null ? (
              <AppText color="textSecondary">
                {def.period === 'day' ? 'Today' : 'This week'}: {formatInt(current)} / {formatInt(draftValue.value)} · {formatPercent(goalProgress(current, draftValue.value).percent)} after saving. Your recorded activity stays the same.
              </AppText>
            ) : null}
            <Button label="Save Goal" onPress={() => void save()} loading={saving} />
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} />
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}
