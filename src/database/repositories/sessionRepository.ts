import type { ActivityType } from '@/domain/activityTypes';
import type { TimerState } from '@/domain/timer';
import type { SqlDatabase } from '../types';

export interface WorkoutSession extends TimerState {
  sessionKey: string;
  activityType: ActivityType;
  goalSeconds: number;
}

interface SessionRow {
  session_key: string;
  activity_type: ActivityType;
  goal_seconds: number;
  status: TimerState['status'];
  started_at: number;
  resumed_at: number | null;
  accumulated_ms: number;
  ended_at: number | null;
}

export async function getSession(db: SqlDatabase): Promise<WorkoutSession | null> {
  const r = await db.getFirstAsync<SessionRow>(
    'SELECT session_key, activity_type, goal_seconds, status, started_at, resumed_at, accumulated_ms, ended_at FROM workout_session WHERE id = 1',
  );
  if (!r) return null;
  return {
    sessionKey: r.session_key,
    activityType: r.activity_type,
    goalSeconds: r.goal_seconds,
    status: r.status,
    startedAt: r.started_at,
    resumedAt: r.resumed_at,
    accumulatedMs: r.accumulated_ms,
    endedAt: r.ended_at,
  };
}

/** Persists the singleton session (one in-flight workout at a time). */
export async function saveSession(db: SqlDatabase, s: WorkoutSession): Promise<void> {
  await db.runAsync(
    `INSERT INTO workout_session (id, session_key, activity_type, goal_seconds, status, started_at, resumed_at, accumulated_ms, ended_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET session_key = excluded.session_key, activity_type = excluded.activity_type,
       goal_seconds = excluded.goal_seconds, status = excluded.status, started_at = excluded.started_at,
       resumed_at = excluded.resumed_at, accumulated_ms = excluded.accumulated_ms, ended_at = excluded.ended_at`,
    [s.sessionKey, s.activityType, s.goalSeconds, s.status, s.startedAt, s.resumedAt, s.accumulatedMs, s.endedAt],
  );
}

export async function clearSession(db: SqlDatabase): Promise<void> {
  await db.runAsync('DELETE FROM workout_session WHERE id = 1');
}
