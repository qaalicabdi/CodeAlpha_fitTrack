import type { DateRange } from '@/domain/dates';
import type { SqlDatabase } from '../types';

export interface DailyActivity {
  activityDate: string;
  steps: number;
  distanceM: number;
  caloriesBurned: number;
  activeMinutes: number;
}

export async function upsertDailyActivity(db: SqlDatabase, d: DailyActivity, now = new Date()): Promise<void> {
  const ts = now.toISOString();
  await db.runAsync(
    `INSERT INTO daily_activity (activity_date, steps, distance_m, calories_burned, active_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(activity_date) DO UPDATE SET steps = excluded.steps, distance_m = excluded.distance_m,
       calories_burned = excluded.calories_burned, active_minutes = excluded.active_minutes, updated_at = excluded.updated_at`,
    [d.activityDate, d.steps, d.distanceM, d.caloriesBurned, d.activeMinutes, ts, ts],
  );
}

export async function getDailyActivity(db: SqlDatabase, range: DateRange): Promise<DailyActivity[]> {
  const rows = await db.getAllAsync<{ activity_date: string; steps: number; distance_m: number; calories_burned: number; active_minutes: number }>(
    'SELECT activity_date, steps, distance_m, calories_burned, active_minutes FROM daily_activity WHERE activity_date BETWEEN ? AND ? ORDER BY activity_date',
    [range.from, range.to],
  );
  return rows.map((r) => ({
    activityDate: r.activity_date,
    steps: r.steps,
    distanceM: r.distance_m,
    caloriesBurned: r.calories_burned,
    activeMinutes: r.active_minutes,
  }));
}
