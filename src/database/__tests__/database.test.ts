import { createMigratedDatabase, createTestDatabase } from '../../../test/sqliteTestDb';
import { migrateDatabase, SCHEMA_VERSION } from '../migrations';
import { getDailyActivity } from '../repositories/dailyActivityRepository';
import { getGoalTargets, setGoalTarget } from '../repositories/goalsRepository';
import { getProfile, saveProfile } from '../repositories/profileRepository';
import { clearSession, getSession, saveSession, type WorkoutSession } from '../repositories/sessionRepository';
import { getSettings, updateSettings } from '../repositories/settingsRepository';
import { addSensorSteps, getStepSamples, upsertHourlySteps } from '../repositories/stepsRepository';
import { listWorkouts } from '../repositories/workoutsRepository';
import {
  deleteManualActivity,
  editManualActivity,
  getDaySummary,
  getRangeDays,
  recomputeDays,
  saveManualActivity,
  saveTimerWorkout,
} from '@/services/activityService';
import type { UserProfile } from '@/domain/profile';

const alex: UserProfile = { fullName: 'Alex Morgan', age: 29, weightKg: 72, heightCm: 178, fitnessGoal: 'build_fitness', photoUri: null };

describe('migrations', () => {
  it('creates the schema and records the version', async () => {
    const db = createTestDatabase();
    expect(await migrateDatabase(db)).toBe(SCHEMA_VERSION);
    const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    expect(tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(['app_settings', 'daily_activity', 'goals', 'step_samples', 'user_profile', 'workout_session', 'workouts']),
    );
    db.close();
  });

  it('is idempotent across app restarts', async () => {
    const db = createTestDatabase();
    await migrateDatabase(db);
    await saveProfile(db, alex);
    expect(await migrateDatabase(db)).toBe(SCHEMA_VERSION);
    expect(await getProfile(db)).toEqual(alex);
    db.close();
  });

  it('refuses to run against a newer schema', async () => {
    const db = createTestDatabase();
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
    await expect(migrateDatabase(db)).rejects.toThrow(/newer/);
    db.close();
  });
});

describe('profile, settings and goals', () => {
  it('persists and updates the single profile row', async () => {
    const db = await createMigratedDatabase();
    expect(await getProfile(db)).toBeNull();
    await saveProfile(db, alex);
    await saveProfile(db, { ...alex, weightKg: 74 });
    expect((await getProfile(db))?.weightKg).toBe(74);
    expect((await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM user_profile'))?.n).toBe(1);
    db.close();
  });

  it('rejects invalid profile values at the database level', async () => {
    const db = await createMigratedDatabase();
    await expect(saveProfile(db, { ...alex, age: 5 })).rejects.toThrow();
    db.close();
  });

  it('persists theme and other settings', async () => {
    const db = await createMigratedDatabase();
    expect((await getSettings(db)).theme).toBe('system');
    await updateSettings(db, { theme: 'dark', measurementUnit: 'imperial', onboardingCompleted: true });
    expect(await getSettings(db)).toMatchObject({ theme: 'dark', measurementUnit: 'imperial', onboardingCompleted: true });
    db.close();
  });

  it('seeds default goals and updates targets', async () => {
    const db = await createMigratedDatabase();
    expect(await getGoalTargets(db)).toEqual({ daily_steps: 10000, weekly_workouts: 4, daily_energy: 500, weekly_active_minutes: 180 });
    await setGoalTarget(db, 'daily_steps', 12000);
    expect((await getGoalTargets(db)).daily_steps).toBe(12000);
    await expect(setGoalTarget(db, 'daily_steps', 100)).rejects.toThrow(RangeError);
    db.close();
  });
});

describe('step samples', () => {
  it('re-syncing the same hours replaces values instead of adding', async () => {
    const db = await createMigratedDatabase();
    const hours = [
      { hourStart: '2026-11-07T06:00', steps: 2000 },
      { hourStart: '2026-11-07T07:00', steps: 1950 },
    ];
    expect(await upsertHourlySteps(db, 'health_connect', hours)).toEqual(['2026-11-07']);
    expect(await upsertHourlySteps(db, 'health_connect', hours)).toEqual([]); // unchanged → no affected days
    await upsertHourlySteps(db, 'health_connect', [{ hourStart: '2026-11-07T07:00', steps: 2100 }]);
    const samples = await getStepSamples(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(samples.map((s) => s.steps)).toEqual([2000, 2100]);
    db.close();
  });

  it('a later 0 from the provider clears a stale hour but never inserts empty rows', async () => {
    const db = await createMigratedDatabase();
    await upsertHourlySteps(db, 'health_connect', [{ hourStart: '2026-11-07T06:00', steps: 450 }]);
    expect(
      await upsertHourlySteps(db, 'health_connect', [
        { hourStart: '2026-11-07T06:00', steps: 0 },
        { hourStart: '2026-11-07T07:00', steps: 0 },
      ]),
    ).toEqual(['2026-11-07']);
    const samples = await getStepSamples(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(samples.map((s) => s.steps)).toEqual([0]);
    db.close();
  });

  it('accumulates live sensor deltas per hour', async () => {
    const db = await createMigratedDatabase();
    await addSensorSteps(db, '2026-11-07T10:00', 40);
    await addSensorSteps(db, '2026-11-07T10:00', 25);
    await addSensorSteps(db, '2026-11-07T10:00', 0);
    const [s] = await getStepSamples(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(s?.steps).toBe(65);
    db.close();
  });
});

describe('activity service', () => {
  const nov7 = new Date(2026, 10, 7, 8, 0);

  async function seededDb() {
    const db = await createMigratedDatabase();
    await saveProfile(db, alex);
    await upsertHourlySteps(db, 'health_connect', [
      { hourStart: '2026-11-07T06:00', steps: 2000 },
      { hourStart: '2026-11-07T07:00', steps: 1950 },
      { hourStart: '2026-11-07T08:00', steps: 3300 },
    ]);
    await recomputeDays(db, ['2026-11-07'], alex);
    return db;
  }

  it('aggregates a day from samples', async () => {
    const db = await seededDb();
    const day = await getDaySummary(db, '2026-11-07', alex);
    expect(day.totals.steps).toBe(7250);
    expect(day.hasStepData).toBe(true);
    const [cached] = await getDailyActivity(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(cached?.steps).toBe(7250);
    db.close();
  });

  it('saves a manual activity once, adding energy and minutes but not steps', async () => {
    const db = await seededDb();
    const before = (await getDaySummary(db, '2026-11-07', alex)).totals;
    const input = { activityType: 'yoga' as const, start: nov7, durationMinutes: 20, caloriesOverride: null };
    const first = await saveManualActivity(db, 'form-1', input, alex);
    const again = await saveManualActivity(db, 'form-1', input, alex); // double tap
    expect(first.created).toBe(true);
    expect(again).toEqual({ id: first.id, created: false });
    const after = (await getDaySummary(db, '2026-11-07', alex)).totals;
    expect(after.steps).toBe(before.steps);
    expect(after.activityEnergy).toBe(before.activityEnergy + 60);
    expect(after.activeMinutes).toBe(before.activeMinutes + 20);
    const [cached] = await getDailyActivity(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(cached?.caloriesBurned).toBe(after.activityEnergy);
    db.close();
  });

  it('edits and deletes manual entries and recomputes totals', async () => {
    const db = await seededDb();
    const { id } = await saveManualActivity(db, 'form-2', { activityType: 'yoga', start: nov7, durationMinutes: 20, caloriesOverride: 80 }, alex);
    let [w] = await listWorkouts(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(w).toMatchObject({ caloriesBurned: 80, caloriesEstimated: 60, caloriesManuallyAdjusted: true });

    // Move it to the previous day: both days are recomputed.
    await editManualActivity(db, id, { activityType: 'strength', start: new Date(2026, 10, 6, 18, 15), durationMinutes: 40, caloriesOverride: null }, alex);
    expect(await listWorkouts(db, { from: '2026-11-07', to: '2026-11-07' })).toHaveLength(0);
    [w] = await listWorkouts(db, { from: '2026-11-06', to: '2026-11-06' });
    expect(w).toMatchObject({ activityType: 'strength', caloriesBurned: 240, caloriesManuallyAdjusted: false });
    const days = await getRangeDays(db, { from: '2026-11-06', to: '2026-11-07' });
    expect(days.map((d) => d.caloriesBurned)).toEqual([240, (await getDaySummary(db, '2026-11-07', alex)).totals.activityEnergy]);

    await deleteManualActivity(db, id, alex);
    expect((await getRangeDays(db, { from: '2026-11-06', to: '2026-11-06' }))[0]?.caloriesBurned).toBe(0);
    db.close();
  });

  it('saves a finished timer session exactly once and clears it', async () => {
    const db = await seededDb();
    const start = new Date(2026, 10, 7, 9, 10).getTime();
    const session: WorkoutSession = {
      sessionKey: 'session-abc',
      activityType: 'running',
      goalSeconds: 1800,
      status: 'finished',
      startedAt: start,
      resumedAt: null,
      accumulatedMs: (24 * 60 + 38) * 1000,
      endedAt: start + 26 * 60_000,
    };
    await saveSession(db, session);
    expect(await getSession(db)).toEqual(session);
    const id = await saveTimerWorkout(db, session, alex);
    const id2 = await saveTimerWorkout(db, session, alex);
    expect(id2).toBe(id);
    expect(await getSession(db)).toBeNull();
    const workouts = await listWorkouts(db, { from: '2026-11-07', to: '2026-11-07' });
    expect(workouts).toHaveLength(1);
    expect(workouts[0]).toMatchObject({ source: 'timer', durationSeconds: 1478, caloriesBurned: 245 });
    db.close();
  });

  it('refuses to save an unfinished session', async () => {
    const db = await seededDb();
    const session: WorkoutSession = {
      sessionKey: 's',
      activityType: 'walking',
      goalSeconds: 1800,
      status: 'running',
      startedAt: 0,
      resumedAt: 0,
      accumulatedMs: 0,
      endedAt: null,
    };
    await expect(saveTimerWorkout(db, session, alex)).rejects.toThrow(/Finish/);
    await clearSession(db);
    db.close();
  });

  it('zero-fills days without activity in a range', async () => {
    const db = await seededDb();
    const week = await getRangeDays(db, { from: '2026-11-02', to: '2026-11-08' });
    expect(week).toHaveLength(7);
    expect(week.map((d) => d.steps)).toEqual([0, 0, 0, 0, 0, 7250, 0]);
    db.close();
  });
});
