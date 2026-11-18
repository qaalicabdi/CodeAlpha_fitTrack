import type { ActivityType } from '@/domain/activityTypes';
import type { DateRange } from '@/domain/dates';
import type { SqlDatabase } from '../types';

export type WorkoutSource = 'timer' | 'manual';

export interface Workout {
  id: number;
  clientId: string;
  activityType: ActivityType;
  source: WorkoutSource;
  date: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  caloriesBurned: number;
  caloriesEstimated: number;
  caloriesManuallyAdjusted: boolean;
  distanceM: number | null;
}

export type NewWorkout = Omit<Workout, 'id'>;

interface WorkoutRow {
  id: number;
  client_id: string;
  activity_type: ActivityType;
  source: WorkoutSource;
  date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  calories_burned: number;
  calories_estimated: number;
  calories_manually_adjusted: number;
  distance_m: number | null;
}

const COLUMNS =
  'id, client_id, activity_type, source, date, start_time, end_time, duration_seconds, calories_burned, calories_estimated, calories_manually_adjusted, distance_m';

function map(r: WorkoutRow): Workout {
  return {
    id: r.id,
    clientId: r.client_id,
    activityType: r.activity_type,
    source: r.source,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    durationSeconds: r.duration_seconds,
    caloriesBurned: r.calories_burned,
    caloriesEstimated: r.calories_estimated,
    caloriesManuallyAdjusted: r.calories_manually_adjusted === 1,
    distanceM: r.distance_m,
  };
}

/**
 * Inserts a workout. `clientId` is an idempotency key — saving the same timer session or form
 * submission twice returns the existing row instead of creating a duplicate.
 */
export async function insertWorkout(db: SqlDatabase, w: NewWorkout, now = new Date()): Promise<{ id: number; created: boolean }> {
  const ts = now.toISOString();
  const result = await db.runAsync(
    `INSERT INTO workouts (client_id, activity_type, source, date, start_time, end_time, duration_seconds,
       calories_burned, calories_estimated, calories_manually_adjusted, distance_m, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(client_id) DO NOTHING`,
    [
      w.clientId, w.activityType, w.source, w.date, w.startTime, w.endTime, w.durationSeconds,
      w.caloriesBurned, w.caloriesEstimated, w.caloriesManuallyAdjusted ? 1 : 0, w.distanceM, ts, ts,
    ],
  );
  if (result.changes > 0) return { id: result.lastInsertRowId, created: true };
  const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM workouts WHERE client_id = ?', [w.clientId]);
  if (!existing) throw new Error('Workout insert failed');
  return { id: existing.id, created: false };
}

export async function getWorkout(db: SqlDatabase, id: number): Promise<Workout | null> {
  const row = await db.getFirstAsync<WorkoutRow>(`SELECT ${COLUMNS} FROM workouts WHERE id = ?`, [id]);
  return row ? map(row) : null;
}

export async function listWorkouts(
  db: SqlDatabase,
  range: DateRange,
  types?: readonly ActivityType[],
  limit?: number,
): Promise<Workout[]> {
  const params: (string | number)[] = [range.from, range.to];
  let typeClause = '';
  if (types && types.length > 0) {
    typeClause = ` AND activity_type IN (${types.map(() => '?').join(', ')})`;
    params.push(...types);
  }
  let limitClause = '';
  if (limit !== undefined) {
    limitClause = ' LIMIT ?';
    params.push(limit);
  }
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT ${COLUMNS} FROM workouts WHERE date BETWEEN ? AND ?${typeClause} ORDER BY start_time DESC${limitClause}`,
    params,
  );
  return rows.map(map);
}

export async function listRecentWorkouts(db: SqlDatabase, limit: number): Promise<Workout[]> {
  const rows = await db.getAllAsync<WorkoutRow>(`SELECT ${COLUMNS} FROM workouts ORDER BY start_time DESC LIMIT ?`, [limit]);
  return rows.map(map);
}

export type ManualWorkoutUpdate = Pick<
  Workout,
  'activityType' | 'date' | 'startTime' | 'endTime' | 'durationSeconds' | 'caloriesBurned' | 'caloriesEstimated' | 'caloriesManuallyAdjusted' | 'distanceM'
>;

/** Only manual entries are editable — timer sessions are system records. Returns the previous date. */
export async function updateManualWorkout(db: SqlDatabase, id: number, u: ManualWorkoutUpdate, now = new Date()): Promise<string> {
  const before = await getWorkout(db, id);
  if (!before) throw new Error('Activity not found');
  if (before.source !== 'manual') throw new Error('Only manually logged activities can be edited');
  await db.runAsync(
    `UPDATE workouts SET activity_type = ?, date = ?, start_time = ?, end_time = ?, duration_seconds = ?,
       calories_burned = ?, calories_estimated = ?, calories_manually_adjusted = ?, distance_m = ?, updated_at = ?
     WHERE id = ? AND source = 'manual'`,
    [
      u.activityType, u.date, u.startTime, u.endTime, u.durationSeconds, u.caloriesBurned, u.caloriesEstimated,
      u.caloriesManuallyAdjusted ? 1 : 0, u.distanceM, now.toISOString(), id,
    ],
  );
  return before.date;
}

/** Deletes a manual entry. Returns its date so totals can be recomputed. */
export async function deleteManualWorkout(db: SqlDatabase, id: number): Promise<string> {
  const before = await getWorkout(db, id);
  if (!before) throw new Error('Activity not found');
  if (before.source !== 'manual') throw new Error('Only manually logged activities can be deleted');
  await db.runAsync("DELETE FROM workouts WHERE id = ? AND source = 'manual'", [id]);
  return before.date;
}
