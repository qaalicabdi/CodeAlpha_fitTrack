import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getGoalTargets, setGoalTarget, type GoalTargets } from '@/database/repositories/goalsRepository';
import { getProfile, saveProfile } from '@/database/repositories/profileRepository';
import { getSettings, updateSettings, type AppSettings } from '@/database/repositories/settingsRepository';
import type { SqlDatabase } from '@/database/types';
import type { GoalType } from '@/domain/goals';
import type { UserProfile } from '@/domain/profile';

interface AppData {
  db: SqlDatabase;
  profile: UserProfile | null;
  settings: AppSettings;
  goals: GoalTargets;
  /** Increments after every write; queries depend on it to refresh. */
  version: number;
  invalidate: () => void;
  saveProfile: (p: UserProfile) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setGoal: (type: GoalType, target: number) => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

interface Loaded {
  profile: UserProfile | null;
  settings: AppSettings;
  goals: GoalTargets;
}

/** Loads profile/settings/goals once, then keeps them in sync with writes made through it. */
export function AppDataProvider({ db, children, fallback }: { db: SqlDatabase; children: ReactNode; fallback: ReactNode }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    const [profile, settings, goals] = await Promise.all([getProfile(db), getSettings(db), getGoalTargets(db)]);
    setLoaded({ profile, settings, goals });
  }, [db]);

  useEffect(() => {
    let alive = true;
    Promise.all([getProfile(db), getSettings(db), getGoalTargets(db)]).then(([profile, settings, goals]) => {
      if (alive) setLoaded({ profile, settings, goals });
    });
    return () => {
      alive = false;
    };
  }, [db]);

  const invalidate = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo<AppData | null>(() => {
    if (!loaded) return null;
    return {
      db,
      ...loaded,
      version,
      invalidate,
      saveProfile: async (p) => {
        await saveProfile(db, p);
        await reload();
        invalidate();
      },
      updateSettings: async (patch) => {
        await updateSettings(db, patch);
        await reload();
        invalidate();
      },
      setGoal: async (type, target) => {
        await setGoalTarget(db, type, target);
        await reload();
        invalidate();
      },
    };
  }, [db, loaded, version, invalidate, reload]);

  if (!value) return <>{fallback}</>;
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}

/** The profile is guaranteed after onboarding; screens behind onboarding use this. */
export function useProfile(): UserProfile {
  const { profile } = useAppData();
  if (!profile) throw new Error('Profile missing — onboarding not completed');
  return profile;
}

export type QueryState<T> = { status: 'loading'; data: undefined; error: undefined } | { status: 'success'; data: T; error: undefined } | { status: 'error'; data: undefined; error: Error };

/**
 * Runs an async database query and re-runs it whenever data changes (`version`) or deps change.
 * Stale results from superseded runs are ignored.
 */
export function useDbQuery<T>(query: (db: SqlDatabase) => Promise<T>, deps: readonly unknown[]): QueryState<T> & { reload: () => void } {
  const { db, version } = useAppData();
  const [state, setState] = useState<QueryState<T>>({ status: 'loading', data: undefined, error: undefined });
  const [nonce, setNonce] = useState(0);
  const run = useRef(0);

  useEffect(() => {
    const id = ++run.current;
    query(db).then(
      (data) => {
        if (id === run.current) setState({ status: 'success', data, error: undefined });
      },
      (error: unknown) => {
        if (id === run.current) setState({ status: 'error', data: undefined, error: error instanceof Error ? error : new Error(String(error)) });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
