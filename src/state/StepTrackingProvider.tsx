import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { addSensorSteps, upsertHourlySteps } from '@/database/repositories/stepsRepository';
import { addDays, startOfDay, toDateKey, toHourKey } from '@/domain/dates';
import { recomputeDays } from '@/services/activityService';
import { resolveStepProvider, type StepProvider } from '@/services/steps';
import { useAppData } from './AppDataProvider';

/**
 * off          – user has not turned tracking on (or turned it off)
 * unavailable  – this device/platform cannot provide step data
 * denied       – the OS / Health Connect permission is not granted
 * enabled      – data is being read
 */
export type TrackingStatus = 'checking' | 'off' | 'unavailable' | 'denied' | 'enabled';

interface StepTracking {
  status: TrackingStatus;
  providerName: string | null;
  /** true when only live (foreground) counting is possible */
  liveOnly: boolean;
  lastSyncedAt: Date | null;
  enable: () => Promise<TrackingStatus>;
  disable: () => Promise<void>;
  sync: () => Promise<void>;
  openSettings: () => Promise<void>;
}

const Ctx = createContext<StepTracking | null>(null);

const SYNC_INTERVAL_MS = 60_000;
const SENSOR_FLUSH_MS = 10_000;
const FIRST_SYNC_DAYS = 7;

export function StepTrackingProvider({ children }: { children: ReactNode }) {
  const { db, settings, profile, updateSettings, invalidate } = useAppData();
  const [provider, setProvider] = useState<StepProvider | null>(null);
  const [status, setStatus] = useState<TrackingStatus>('checking');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const lastSyncRef = useRef<Date | null>(null);
  const syncing = useRef(false);
  const pendingSensor = useRef<Map<string, number>>(new Map());

  const weightKg = profile?.weightKg;
  const heightCm = profile?.heightCm;
  const bodyRef = useRef<{ weightKg: number; heightCm: number } | null>(null);
  useEffect(() => {
    bodyRef.current = weightKg !== undefined && heightCm !== undefined ? { weightKg, heightCm } : null;
  }, [weightKg, heightCm]);

  // Resolve provider + status whenever the user's intent changes.
  const refreshStatus = useCallback(async (): Promise<TrackingStatus> => {
    let p: StepProvider | null = null;
    let next: TrackingStatus;
    try {
      p = await resolveStepProvider();
      if (!p) next = 'unavailable';
      else if ((await p.availability()) !== 'available') next = 'unavailable';
      else if (!settings.stepTrackingEnabled) next = 'off';
      else next = (await p.permission()) === 'granted' ? 'enabled' : 'denied';
    } catch {
      next = 'unavailable';
    }
    setProvider(p);
    setStatus(next);
    return next;
  }, [settings.stepTrackingEnabled]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (alive) await refreshStatus();
    };
    const t = setTimeout(() => void run(), 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [refreshStatus]);

  const sync = useCallback(async () => {
    if (!provider?.readHourly || status !== 'enabled' || !bodyRef.current || syncing.current) return;
    syncing.current = true;
    try {
      const now = new Date();
      // Always re-read since yesterday's midnight: health apps write and correct data late
      // (e.g. a watch syncing after midnight), and re-reading is idempotent.
      const from = lastSyncRef.current
        ? new Date(Math.min(addDays(startOfDay(now), -1).getTime(), lastSyncRef.current.getTime() - 3_600_000))
        : addDays(startOfDay(now), -FIRST_SYNC_DAYS);
      const hours = await provider.readHourly(from, now);
      const changed = await upsertHourlySteps(db, provider.source, hours);
      const dates = new Set([...changed, toDateKey(now)]);
      await recomputeDays(db, dates, bodyRef.current);
      lastSyncRef.current = now;
      setLastSyncedAt(now);
      invalidate();
    } finally {
      syncing.current = false;
    }
  }, [db, provider, status, invalidate]);

  // Periodic + foreground sync for historical providers.
  useEffect(() => {
    if (status !== 'enabled' || !provider?.readHourly) return;
    void sync();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void sync();
    }, SYNC_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void refreshStatus().then((st) => (st === 'enabled' ? sync() : undefined));
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [status, provider, sync, refreshStatus]);

  // Live sensor counting (Android fallback): buffer deltas per hour and flush periodically.
  useEffect(() => {
    if (status !== 'enabled' || !provider?.watch) return;
    const flush = async () => {
      const pending = pendingSensor.current;
      if (pending.size === 0 || !bodyRef.current) return;
      pendingSensor.current = new Map();
      const dates = new Set<string>();
      for (const [hour, delta] of pending) {
        await addSensorSteps(db, hour, delta);
        dates.add(hour.slice(0, 10));
      }
      await recomputeDays(db, dates, bodyRef.current);
      const now = new Date();
      setLastSyncedAt(now);
      invalidate();
    };
    const unsubscribe = provider.watch((delta) => {
      const hour = toHourKey(new Date());
      pendingSensor.current.set(hour, (pendingSensor.current.get(hour) ?? 0) + delta);
    });
    const timer = setInterval(() => void flush(), SENSOR_FLUSH_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') void flush();
    });
    return () => {
      unsubscribe();
      clearInterval(timer);
      sub.remove();
      void flush();
    };
  }, [status, provider, db, invalidate]);

  const enable = useCallback(async (): Promise<TrackingStatus> => {
    const p = provider ?? (await resolveStepProvider());
    if (!p || (await p.availability()) !== 'available') {
      setStatus('unavailable');
      return 'unavailable';
    }
    const permission = (await p.permission()) === 'granted' ? 'granted' : await p.requestPermission();
    await updateSettings({ stepTrackingEnabled: permission === 'granted' });
    const next: TrackingStatus = permission === 'granted' ? 'enabled' : 'denied';
    setStatus(next);
    return next;
  }, [provider, updateSettings]);

  const disable = useCallback(async () => {
    await updateSettings({ stepTrackingEnabled: false });
    setStatus('off');
  }, [updateSettings]);

  const openSettings = useCallback(async () => {
    if (provider) await provider.openSettings();
  }, [provider]);

  const value = useMemo<StepTracking>(
    () => ({
      status,
      providerName: provider?.name ?? null,
      liveOnly: !!provider && !provider.readHourly,
      lastSyncedAt,
      enable,
      disable,
      sync,
      openSettings,
    }),
    [status, provider, lastSyncedAt, enable, disable, sync, openSettings],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStepTracking(): StepTracking {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStepTracking must be used inside StepTrackingProvider');
  return ctx;
}
