import { useCallback, useEffect, useState } from 'react';

import { clearSession, getSession, saveSession, type WorkoutSession } from '@/database/repositories/sessionRepository';
import type { ActivityType } from '@/domain/activityTypes';
import { finishTimer, pauseTimer, resumeTimer, startTimer } from '@/domain/timer';
import { useAppData } from '@/state/AppDataProvider';

export const DEFAULT_SESSION_GOAL_SECONDS = 30 * 60;

export function newClientId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The persisted in-flight workout. Every transition is written to SQLite before the UI updates,
 * so the session survives backgrounding and process death and can never be duplicated.
 */
export function useWorkoutSession() {
  const { db, invalidate } = useAppData();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getSession(db).then((s) => {
      if (alive) {
        setSession(s);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [db]);

  const persist = useCallback(
    async (next: WorkoutSession) => {
      await saveSession(db, next);
      setSession(next);
      invalidate();
    },
    [db, invalidate],
  );

  const start = useCallback(
    async (activityType: ActivityType, goalSeconds = DEFAULT_SESSION_GOAL_SECONDS) => {
      // Never start a second session while one exists.
      const existing = await getSession(db);
      if (existing) {
        setSession(existing);
        return existing;
      }
      const next: WorkoutSession = { ...startTimer(Date.now()), sessionKey: newClientId('session'), activityType, goalSeconds };
      await persist(next);
      return next;
    },
    [db, persist],
  );

  const pause = useCallback(async () => {
    if (session) await persist({ ...session, ...pauseTimer(session, Date.now()) });
  }, [session, persist]);

  const resume = useCallback(async () => {
    if (session) await persist({ ...session, ...resumeTimer(session, Date.now()) });
  }, [session, persist]);

  const finish = useCallback(async () => {
    if (!session) return null;
    const next = { ...session, ...finishTimer(session, Date.now()) };
    await persist(next);
    return next;
  }, [session, persist]);

  const discard = useCallback(async () => {
    await clearSession(db);
    setSession(null);
    invalidate();
  }, [db, invalidate]);

  return { session, loaded, start, pause, resume, finish, discard };
}
