import { computeDailyTotals, mergeHourlySources, type DailyTotals, type HourlySteps } from '@/domain/aggregation';
import { estimateWorkoutCalories, estimateWorkoutDistanceM, resolveCalories } from '@/domain/calories';
import { eachDateKey, toDateKey, type DateRange } from '@/domain/dates';
import type { ActivityType } from '@/domain/activityTypes';
import type { UserProfile } from '@/domain/profile';
import { elapsedMs } from '@/domain/timer';
import { getDailyActivity, upsertDailyActivity, type DailyActivity } from '@/database/repositories/dailyActivityRepository';
import { clearSession, type WorkoutSession } from '@/database/repositories/sessionRepository';
import { getStepSamples } from '@/database/repositories/stepsRepository';
import {
  deleteManualWorkout,
  insertWorkout,
  listWorkouts,
  updateManualWorkout,
  type Workout,
} from '@/database/repositories/workoutsRepository';
import type { SqlDatabase } from '@/database/types';

type BodyMetrics = Pick<UserProfile, 'weightKg' | 'heightCm'>;

export interface DaySummary {
  date: string;
  totals: DailyTotals;
  hourly: HourlySteps[];
  workouts: Workout[];
  hasStepData: boolean;
}

/** Live summary for one day, computed from raw samples and workouts. */
export async function getDaySummary(db: SqlDatabase, date: string, body: BodyMetrics): Promise<DaySummary> {
  const range = { from: date, to: date };
  const [samples, workouts] = await Promise.all([getStepSamples(db, range), listWorkouts(db, range)]);
  const hourly = mergeHourlySources(samples);
  const totals = computeDailyTotals({ hourly, workouts, weightKg: body.weightKg, heightCm: body.heightCm });
  return { date, totals, hourly, workouts, hasStepData: samples.length > 0 };
}

/** Recomputes the cached `daily_activity` rows for the given dates. */
export async function recomputeDays(db: SqlDatabase, dates: Iterable<string>, body: BodyMetrics): Promise<void> {
  for (const date of new Set(dates)) {
    const { totals } = await getDaySummary(db, date, body);
    await upsertDailyActivity(db, {
      activityDate: date,
      steps: totals.steps,
      distanceM: totals.distanceM,
      caloriesBurned: totals.activityEnergy,
      activeMinutes: totals.activeMinutes,
    });
  }
}

export interface RangeDay extends DailyActivity {
  workoutCount: number;
  workoutMinutes: number;
}

/** Every day in the range (zero-filled when nothing was recorded) with its workout counts. */
export async function getRangeDays(db: SqlDatabase, range: DateRange): Promise<RangeDay[]> {
  const [days, workouts] = await Promise.all([getDailyActivity(db, range), listWorkouts(db, range)]);
  const byDate = new Map(days.map((d) => [d.activityDate, d]));
  const workoutsByDate = new Map<string, { count: number; seconds: number }>();
  for (const w of workouts) {
    const agg = workoutsByDate.get(w.date) ?? { count: 0, seconds: 0 };
    agg.count += 1;
    agg.seconds += w.durationSeconds;
    workoutsByDate.set(w.date, agg);
  }
  return eachDateKey(range).map((date) => {
    const d = byDate.get(date);
    const w = workoutsByDate.get(date);
    return {
      activityDate: date,
      steps: d?.steps ?? 0,
      distanceM: d?.distanceM ?? 0,
      caloriesBurned: d?.caloriesBurned ?? 0,
      activeMinutes: d?.activeMinutes ?? 0,
      workoutCount: w?.count ?? 0,
      workoutMinutes: Math.round((w?.seconds ?? 0) / 60),
    };
  });
}

export interface SessionSummary {
  activityType: ActivityType;
  durationSeconds: number;
  calories: number;
  distanceM: number | null;
  start: Date;
  end: Date;
  goalRatio: number;
}

export function summarizeSession(session: WorkoutSession, weightKg: number, now: number): SessionSummary {
  const durationSeconds = Math.floor(elapsedMs(session, now) / 1000);
  return {
    activityType: session.activityType,
    durationSeconds,
    calories: estimateWorkoutCalories(session.activityType, durationSeconds, weightKg),
    distanceM: estimateWorkoutDistanceM(session.activityType, durationSeconds),
    start: new Date(session.startedAt),
    end: new Date(session.endedAt ?? now),
    goalRatio: session.goalSeconds > 0 ? durationSeconds / session.goalSeconds : 0,
  };
}

/**
 * Saves a finished timer session exactly once (session key = idempotency key), refreshes the
 * day's totals and clears the in-flight session — all in one transaction.
 */
export async function saveTimerWorkout(db: SqlDatabase, session: WorkoutSession, profile: BodyMetrics): Promise<number> {
  if (session.status !== 'finished' || session.endedAt === null) throw new Error('Finish the workout before saving.');
  const summary = summarizeSession(session, profile.weightKg, session.endedAt);
  if (summary.durationSeconds < 1) throw new Error('This session is too short to save.');
  const date = toDateKey(summary.start);
  let id = 0;
  await db.withTransactionAsync(async () => {
    const result = await insertWorkout(db, {
      clientId: session.sessionKey,
      activityType: session.activityType,
      source: 'timer',
      date,
      startTime: summary.start.toISOString(),
      endTime: summary.end.toISOString(),
      durationSeconds: summary.durationSeconds,
      caloriesBurned: summary.calories,
      caloriesEstimated: summary.calories,
      caloriesManuallyAdjusted: false,
      distanceM: summary.distanceM,
    });
    id = result.id;
    await recomputeDays(db, [date], profile);
    await clearSession(db);
  });
  return id;
}

export interface ManualActivityInput {
  activityType: ActivityType;
  start: Date;
  durationMinutes: number;
  /** null = keep the estimate */
  caloriesOverride: number | null;
}

export function buildManualRecord(input: ManualActivityInput, weightKg: number) {
  const durationSeconds = Math.round(input.durationMinutes * 60);
  const estimated = estimateWorkoutCalories(input.activityType, durationSeconds, weightKg);
  const calories = resolveCalories(estimated, input.caloriesOverride);
  const end = new Date(input.start.getTime() + durationSeconds * 1000);
  return {
    activityType: input.activityType,
    date: toDateKey(input.start),
    startTime: input.start.toISOString(),
    endTime: end.toISOString(),
    durationSeconds,
    caloriesBurned: calories.calories,
    caloriesEstimated: calories.estimated,
    caloriesManuallyAdjusted: calories.manuallyAdjusted,
    distanceM: estimateWorkoutDistanceM(input.activityType, durationSeconds),
  };
}

export async function saveManualActivity(
  db: SqlDatabase,
  clientId: string,
  input: ManualActivityInput,
  profile: BodyMetrics,
): Promise<{ id: number; created: boolean }> {
  const record = buildManualRecord(input, profile.weightKg);
  let result = { id: 0, created: false };
  await db.withTransactionAsync(async () => {
    result = await insertWorkout(db, { ...record, clientId, source: 'manual' });
    await recomputeDays(db, [record.date], profile);
  });
  return result;
}

export async function editManualActivity(db: SqlDatabase, id: number, input: ManualActivityInput, profile: BodyMetrics): Promise<void> {
  const record = buildManualRecord(input, profile.weightKg);
  await db.withTransactionAsync(async () => {
    const previousDate = await updateManualWorkout(db, id, record);
    await recomputeDays(db, [previousDate, record.date], profile);
  });
}

export async function deleteManualActivity(db: SqlDatabase, id: number, profile: BodyMetrics): Promise<void> {
  await db.withTransactionAsync(async () => {
    const date = await deleteManualWorkout(db, id);
    await recomputeDays(db, [date], profile);
  });
}
