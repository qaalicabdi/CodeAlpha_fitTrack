import type { StepSample } from '@/domain/aggregation';
import type { DateRange } from '@/domain/dates';
import type { SqlDatabase } from '../types';

export type StepSource = 'health_connect' | 'core_motion' | 'sensor';

export interface HourCount {
  hourStart: string; // 'YYYY-MM-DDTHH:00'
  steps: number;
}

/**
 * Stores authoritative hourly totals (Health Connect / Core Motion). Re-syncing the same hour
 * replaces its value instead of adding to it, so repeated syncs never double count.
 * Returns the set of affected date keys.
 */
export async function upsertHourlySteps(db: SqlDatabase, source: StepSource, hours: readonly HourCount[], now = new Date()): Promise<string[]> {
  const dates = new Set<string>();
  const ts = now.toISOString();
  await db.withTransactionAsync(async () => {
    for (const h of hours) {
      const steps = Math.max(0, Math.round(h.steps));
      const date = h.hourStart.slice(0, 10);
      if (steps === 0) {
        // Only correct an existing hour down to 0; never create empty rows.
        const cleared = await db.runAsync('UPDATE step_samples SET steps = 0, updated_at = ? WHERE source = ? AND hour_start = ? AND steps <> 0', [ts, source, h.hourStart]);
        if (cleared.changes > 0) dates.add(date);
        continue;
      }
      const result = await db.runAsync(
        `INSERT INTO step_samples (source, hour_start, date, steps, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(source, hour_start) DO UPDATE SET steps = excluded.steps, updated_at = excluded.updated_at
         WHERE step_samples.steps <> excluded.steps`,
        [source, h.hourStart, date, steps, ts],
      );
      if (result.changes > 0) dates.add(date);
    }
  });
  return [...dates];
}

/**
 * Adds live sensor deltas (Android step-counter fallback). The sensor reports steps since the
 * subscription started, so the caller passes only the new increment.
 */
export async function addSensorSteps(db: SqlDatabase, hourStart: string, delta: number, now = new Date()): Promise<void> {
  if (!(delta > 0)) return;
  await db.runAsync(
    `INSERT INTO step_samples (source, hour_start, date, steps, updated_at) VALUES ('sensor', ?, ?, ?, ?)
     ON CONFLICT(source, hour_start) DO UPDATE SET steps = step_samples.steps + excluded.steps, updated_at = excluded.updated_at`,
    [hourStart, hourStart.slice(0, 10), Math.round(delta), now.toISOString()],
  );
}

export async function getStepSamples(db: SqlDatabase, range: DateRange): Promise<(StepSample & { date: string })[]> {
  const rows = await db.getAllAsync<{ source: string; hour_start: string; date: string; steps: number }>(
    'SELECT source, hour_start, date, steps FROM step_samples WHERE date BETWEEN ? AND ? ORDER BY hour_start',
    [range.from, range.to],
  );
  return rows.map((r) => ({ source: r.source, hourStart: r.hour_start, date: r.date, steps: r.steps }));
}

export async function getLastStepUpdate(db: SqlDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ updated_at: string | null }>('SELECT MAX(updated_at) AS updated_at FROM step_samples');
  return row?.updated_at ?? null;
}
