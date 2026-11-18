import { ArrowDown, ArrowUp, Flame, Footprints, Route, Timer } from 'lucide-react-native';
import { View } from 'react-native';

import { GoalProgressRow, StatCard } from '@/components/cards/data';
import { LineChart } from '@/components/charts/charts';
import { AppText } from '@/components/common/AppText';
import { ErrorCard, LoadingState } from '@/components/common/feedback';
import { Card, Footnote, SectionHeader } from '@/components/common/layout';
import { listWorkouts } from '@/database/repositories/workoutsRepository';
import { averageOfRecorded, blockLabel, peakBlock, percentChange, twoHourBlocks } from '@/domain/aggregation';
import { addDays, formatMonthDay, formatRange, fromDateKey, monthRange, toDateKey, WEEKDAY_INITIALS, weekRange } from '@/domain/dates';
import { distanceValue, formatInt, formatPercent, pluralize, type MeasurementUnit } from '@/domain/format';
import { goalProgress, monthlyTargets } from '@/domain/goals';
import { FITNESS_GOAL_LABEL } from '@/domain/profile';
import { HourlyCard } from '@/features/activity/HourlyCard';
import { WeekBarsCard } from '@/features/dashboard/WeekStepsCard';
import { getDaySummary, getRangeDays } from '@/services/activityService';
import { useAppData, useDbQuery, useProfile } from '@/state/AppDataProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { ConsistencyCalendar } from './ConsistencyCalendar';

function QueryFallback({ status, reload }: { status: 'loading' | 'error'; reload: () => void }) {
  return status === 'loading' ? (
    <LoadingState label="Loading your progress…" />
  ) : (
    <ErrorCard title="Progress didn't load." message="We couldn't read your activity from this device." onRetry={reload} />
  );
}

/** 16 Progress — Daily */
export function DailyView({ anchor, now, unit }: { anchor: Date; now: Date; unit: MeasurementUnit }) {
  const profile = useProfile();
  const { goals } = useAppData();
  const key = toDateKey(anchor);
  const isToday = key === toDateKey(now);
  const q = useDbQuery((db) => getDaySummary(db, key, profile), [key, profile.weightKg, profile.heightCm]);
  if (q.status !== 'success') return <QueryFallback status={q.status} reload={q.reload} />;

  const { totals: t, hourly } = q.data;
  const dist = distanceValue(t.distanceM, unit);
  const blocks = twoHourBlocks(hourly);
  const peak = peakBlock(blocks);
  const insight =
    peak >= 0 && t.steps > 0
      ? `Your busiest block (${blockLabel(peak)}) made up ${formatPercent(((blocks[peak] ?? 0) / t.steps) * 100)} of ${isToday ? "today's" : "the day's"} steps.`
      : `No steps were recorded ${isToday ? 'yet today' : 'on this day'}.`;
  const steps = goalProgress(t.steps, goals.daily_steps);
  const energy = goalProgress(t.activityEnergy, goals.daily_energy);

  let nudgeTitle: string;
  let nudgeBody: string;
  if (steps.complete) {
    nudgeTitle = 'Goal closed. Nicely done.';
    nudgeBody = `${formatInt(t.steps)} steps ${isToday ? 'today' : 'that day'} — ${formatPercent(steps.percent)} of your goal.`;
  } else if (isToday) {
    nudgeTitle = t.steps > 0 ? "You're building momentum." : 'Every walk starts with one step.';
    nudgeBody = `Just ${formatInt(steps.remaining)} more steps to close your daily goal. A short evening walk is a good next move.`;
  } else {
    nudgeTitle = 'A day on the record.';
    nudgeBody = `You reached ${formatPercent(steps.percent)} of your step goal. Every day counts toward the bigger picture.`;
  }

  return (
    <>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={Footprints} value={formatInt(t.steps)} label="Steps" />
          <StatCard icon={Flame} value={formatInt(t.activityEnergy)} unit="kcal" label="Activity energy" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon={Route} value={dist.value} unit={dist.unit} label="Distance" />
          <StatCard icon={Timer} value={String(t.activeMinutes)} unit="min" label="Active time" />
        </View>
      </View>
      <HourlyCard title="Steps through your day" insight={insight} hourly={hourly} currentHour={now.getHours()} isToday={isToday} />
      <Card style={{ gap: 18 }}>
        <SectionHeader title="Daily goals" />
        <GoalProgressRow title="Step goal" percentLabel={formatPercent(steps.percent)} ratio={steps.ratio} detail={`${formatInt(t.steps)} / ${formatInt(goals.daily_steps)} steps`} />
        <GoalProgressRow title="Activity energy" percentLabel={formatPercent(energy.percent)} ratio={energy.ratio} detail={`${formatInt(t.activityEnergy)} / ${formatInt(goals.daily_energy)} kcal`} />
      </Card>
      <Card tone="tint" style={{ gap: 8 }}>
        <AppText variant="leadRegular">{nudgeTitle}</AppText>
        <AppText color="textSecondary">{nudgeBody}</AppText>
      </Card>
    </>
  );
}

/** 17 Progress — Weekly */
export function WeeklyView({ anchor, now }: { anchor: Date; now: Date }) {
  const { goals } = useAppData();
  const { colors, radii } = useTheme();
  const range = weekRange(anchor);
  const today = toDateKey(now);
  const q = useDbQuery((db) => getRangeDays(db, range), [range.from]);
  if (q.status !== 'success') return <QueryFallback status={q.status} reload={q.reload} />;

  const days = q.data;
  const elapsed = days.filter((d) => d.activityDate <= today);
  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const totalEnergy = days.reduce((s, d) => s + d.caloriesBurned, 0);
  const stepAvg = averageOfRecorded(elapsed.map((d) => d.steps));
  const energyAvg = averageOfRecorded(elapsed.map((d) => d.caloriesBurned));
  const workouts = days.reduce((s, d) => s + d.workoutCount, 0);
  const sessionMinutes = days.reduce((s, d) => s + d.workoutMinutes, 0);
  const activeMinutes = days.reduce((s, d) => s + d.activeMinutes, 0);
  const wGoal = goalProgress(workouts, goals.weekly_workouts);
  const mGoal = goalProgress(activeMinutes, goals.weekly_active_minutes);
  const upcoming = days.length - elapsed.length;
  const inProgress = upcoming > 0 || range.to === today;

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard value={formatInt(totalSteps)} label="Total steps" />
        <StatCard value={formatInt(totalEnergy)} unit="kcal" label="Activity energy" />
      </View>
      <WeekBarsCard
        title="Weekly steps"
        subtitle={`${formatInt(stepAvg.average)} daily average · ${pluralize(stepAvg.recordedDays, 'day', 'days')} recorded`}
        axisLabel={`${formatInt(goals.daily_steps / 1000)}k steps`}
        days={days}
        today={today}
        value={(d) => d.steps}
        max={goals.daily_steps}
      />
      <WeekBarsCard
        title="Weekly activity energy"
        subtitle={`${formatInt(energyAvg.average)} kcal daily average · estimated`}
        axisLabel={`${formatInt(goals.daily_energy)} kcal`}
        days={days}
        today={today}
        value={(d) => d.caloriesBurned}
        max={goals.daily_energy}
      />
      <Card style={{ gap: 18 }}>
        <SectionHeader title="Showing up counts" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {days.map((d, i) => (
            <View key={d.activityDate} style={{ alignItems: 'center', gap: 6 }} accessibilityLabel={`${d.activityDate}: ${pluralize(d.workoutCount, 'workout', 'workouts')}`}>
              <View style={{ width: 24, height: 24, borderRadius: radii.indicator, backgroundColor: d.workoutCount > 0 ? colors.primary : colors.track }} />
              <AppText variant="caption" color="textSecondary">
                {WEEKDAY_INITIALS[i]}
              </AppText>
            </View>
          ))}
        </View>
        <GoalProgressRow
          title="Workout goal"
          percentLabel={formatPercent(wGoal.percent)}
          ratio={wGoal.ratio}
          detail={`${workouts} / ${goals.weekly_workouts} workouts · ${wGoal.complete ? 'goal reached' : `${wGoal.remaining === 1 ? 'one more' : `${wGoal.remaining} more`} to go`}`}
        />
        <GoalProgressRow
          title="Active minutes"
          percentLabel={formatPercent(mGoal.percent)}
          ratio={mGoal.ratio}
          detail={`${formatInt(activeMinutes)} / ${formatInt(goals.weekly_active_minutes)} min · includes everyday movement`}
        />
      </Card>
      <Footnote>
        {inProgress ? `Week in progress · ${pluralize(upcoming, 'day is', 'days are')} upcoming, not missed. ` : ''}
        Session durations total {sessionMinutes} min; everyday activity adds {Math.max(0, activeMinutes - sessionMinutes)} min this week.
      </Footnote>
    </>
  );
}

/** 18 Progress — Monthly */
export function MonthlyView({ anchor, now }: { anchor: Date; now: Date }) {
  const profile = useProfile();
  const { goals } = useAppData();
  const { colors } = useTheme();
  const month = monthRange(anchor);
  const today = toDateKey(now);
  const end = month.to < today ? month.to : today;
  // Trend: last 7 days up to `end`, compared with the 7 days before.
  const trendEnd = fromDateKey(end);
  const current = { from: toDateKey(addDays(trendEnd, -6)), to: end };
  const previous = { from: toDateKey(addDays(trendEnd, -13)), to: toDateKey(addDays(trendEnd, -7)) };

  const q = useDbQuery(
    async (db) => {
      const [days, trend, prev, workouts] = await Promise.all([
        getRangeDays(db, { from: month.from, to: end }),
        getRangeDays(db, current),
        getRangeDays(db, previous),
        listWorkouts(db, { from: month.from, to: end }),
      ]);
      return { days, trend, prev, workouts };
    },
    [month.from, end],
  );
  if (q.status !== 'success') return <QueryFallback status={q.status} reload={q.reload} />;

  const { days, trend, prev, workouts } = q.data;
  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const average = days.length > 0 ? Math.round(totalSteps / days.length) : 0;
  const trendTotal = trend.reduce((s, d) => s + d.steps, 0);
  const prevTotal = prev.reduce((s, d) => s + d.steps, 0);
  const change = percentChange(trendTotal, prevTotal);
  const activeDays = days.filter((d) => d.steps > 0 || d.workoutCount > 0).length;
  const workoutDays = new Set(workouts.map((w) => w.date));
  const targets = monthlyTargets(goals);
  const activeMinutes = days.reduce((s, d) => s + d.activeMinutes, 0);
  const wc = goalProgress(workouts.length, targets.workouts);
  const am = goalProgress(activeMinutes, targets.activeMinutes);
  const sv = goalProgress(totalSteps, targets.steps);
  const monthLabel = formatRange({ from: month.from, to: end });
  const lineLabels = [0, 2, 4, 6].map((i) => formatMonthDay(addDays(fromDateKey(current.from), i)));
  const ChangeIcon = change !== null && change < 0 ? ArrowDown : ArrowUp;

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard value={formatInt(totalSteps)} label="Steps · month to date" />
        <StatCard value={formatInt(average)} label="Daily average" />
      </View>
      <Card style={{ gap: 12 }}>
        <SectionHeader title="Your movement trend" />
        <AppText color="textSecondary">
          {formatRange(current).replace(/, \d{4}$/, '')} · compared with {formatRange(previous).replace(/, \d{4}$/, '')}
        </AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="caption" color="textSecondary">
            {formatInt(goals.daily_steps / 1000)}k steps
          </AppText>
          {change !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <ChangeIcon size={12} color={colors.primaryText} />
              <AppText variant="label" color="primaryText">
                {formatPercent(Math.abs(change))}
              </AppText>
            </View>
          ) : (
            <AppText variant="caption" color="textSecondary">
              No earlier week to compare
            </AppText>
          )}
        </View>
        <LineChart values={trend.map((d) => d.steps)} labels={lineLabels} max={goals.daily_steps} accessibilityLabel={`Steps for the last 7 days, total ${formatInt(trendTotal)}`} />
      </Card>
      <Card style={{ gap: 12 }}>
        <SectionHeader title="Consistency calendar" />
        <AppText color="textSecondary">
          {pluralize(activeDays, 'active day', 'active days')} · {pluralize(workouts.length, 'workout', 'workouts')} so far
        </AppText>
        <ConsistencyCalendar month={fromDateKey(month.from)} today={today} workoutDays={workoutDays} />
      </Card>
      <Card style={{ gap: 18 }}>
        <SectionHeader title={`${FITNESS_GOAL_LABEL[profile.fitnessGoal]} · monthly goals`} />
        <GoalProgressRow title="Workout consistency" percentLabel={formatPercent(wc.percent)} ratio={wc.ratio} detail={`${workouts.length} / ${targets.workouts} workouts`} />
        <GoalProgressRow title="Active minutes" percentLabel={formatPercent(am.percent)} ratio={am.ratio} detail={`${formatInt(activeMinutes)} / ${formatInt(targets.activeMinutes)} minutes`} />
        <GoalProgressRow title="Step volume" percentLabel={formatPercent(sv.percent)} ratio={sv.ratio} detail={`${formatInt(totalSteps)} / ${formatInt(targets.steps)} steps`} />
      </Card>
      <Footnote>
        {month.to > today ? `Month to date: ${monthLabel.replace(/, \d{4}$/, '')}. ` : ''}Monthly targets reflect 4 workout weeks and 30 daily step goals. Keep your own pace.
      </Footnote>
    </>
  );
}
