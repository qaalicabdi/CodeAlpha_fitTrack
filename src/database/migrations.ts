import type { SqlDatabase } from './types';

/**
 * Ordered schema migrations. `PRAGMA user_version` records how many have been applied.
 * Never edit a shipped migration — append a new one.
 */
export const MIGRATIONS: readonly string[] = [
  // 1 — initial schema
  `
  CREATE TABLE user_profile (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    full_name     TEXT    NOT NULL,
    age           INTEGER NOT NULL CHECK (age BETWEEN 13 AND 100),
    weight_kg     REAL    NOT NULL CHECK (weight_kg BETWEEN 25 AND 300),
    height_cm     REAL    NOT NULL CHECK (height_cm BETWEEN 100 AND 250),
    fitness_goal  TEXT    NOT NULL CHECK (fitness_goal IN ('stay_active','lose_weight','build_fitness','maintain_health')),
    photo_uri     TEXT,
    created_at    TEXT    NOT NULL,
    updated_at    TEXT    NOT NULL
  );

  CREATE TABLE app_settings (
    id                     INTEGER PRIMARY KEY CHECK (id = 1),
    theme                  TEXT    NOT NULL DEFAULT 'system' CHECK (theme IN ('system','light','dark')),
    measurement_unit       TEXT    NOT NULL DEFAULT 'metric' CHECK (measurement_unit IN ('metric','imperial')),
    notifications_enabled  INTEGER NOT NULL DEFAULT 1,
    step_tracking_enabled  INTEGER NOT NULL DEFAULT 0,
    onboarding_completed   INTEGER NOT NULL DEFAULT 0,
    updated_at             TEXT    NOT NULL
  );
  INSERT INTO app_settings (id, updated_at) VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));

  CREATE TABLE goals (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_type     TEXT    NOT NULL UNIQUE CHECK (goal_type IN ('daily_steps','weekly_workouts','daily_energy','weekly_active_minutes')),
    target_value  REAL    NOT NULL CHECK (target_value > 0),
    period        TEXT    NOT NULL CHECK (period IN ('day','week')),
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT    NOT NULL,
    updated_at    TEXT    NOT NULL
  );
  INSERT INTO goals (goal_type, target_value, period, created_at, updated_at) VALUES
    ('daily_steps',           10000, 'day',  strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('weekly_workouts',           4, 'week', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('daily_energy',            500, 'day',  strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('weekly_active_minutes',   180, 'week', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

  -- Raw step counts per source and local hour. Upserts make syncing idempotent.
  CREATE TABLE step_samples (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source      TEXT    NOT NULL CHECK (source IN ('health_connect','core_motion','sensor')),
    hour_start  TEXT    NOT NULL,          -- local 'YYYY-MM-DDTHH:00'
    date        TEXT    NOT NULL,          -- local 'YYYY-MM-DD'
    steps       INTEGER NOT NULL CHECK (steps >= 0),
    updated_at  TEXT    NOT NULL,
    UNIQUE (source, hour_start)
  );
  CREATE INDEX idx_step_samples_date ON step_samples (date);

  CREATE TABLE workouts (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id                   TEXT    NOT NULL UNIQUE,   -- idempotency key: one save per session/form
    activity_type               TEXT    NOT NULL CHECK (activity_type IN ('walking','running','cycling','gym','strength','yoga','other')),
    source                      TEXT    NOT NULL CHECK (source IN ('timer','manual')),
    date                        TEXT    NOT NULL,          -- local 'YYYY-MM-DD' of start
    start_time                  TEXT    NOT NULL,          -- ISO 8601 UTC
    end_time                    TEXT    NOT NULL,
    duration_seconds            INTEGER NOT NULL CHECK (duration_seconds > 0),
    calories_burned             REAL    NOT NULL CHECK (calories_burned >= 0),
    calories_estimated          REAL    NOT NULL CHECK (calories_estimated >= 0),
    calories_manually_adjusted  INTEGER NOT NULL DEFAULT 0,
    distance_m                  REAL,
    created_at                  TEXT    NOT NULL,
    updated_at                  TEXT    NOT NULL
  );
  CREATE INDEX idx_workouts_date ON workouts (date);
  CREATE INDEX idx_workouts_type_date ON workouts (activity_type, date);

  -- Derived per-day totals (recomputed from step_samples + workouts; one row per date).
  CREATE TABLE daily_activity (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_date    TEXT    NOT NULL UNIQUE,
    steps            INTEGER NOT NULL DEFAULT 0,
    distance_m       REAL    NOT NULL DEFAULT 0,
    calories_burned  REAL    NOT NULL DEFAULT 0,
    active_minutes   INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT    NOT NULL,
    updated_at       TEXT    NOT NULL
  );

  -- At most one in-flight timer session. Elapsed time is derived from timestamps, never ticked.
  CREATE TABLE workout_session (
    id               INTEGER PRIMARY KEY CHECK (id = 1),
    session_key      TEXT    NOT NULL,
    activity_type    TEXT    NOT NULL,
    goal_seconds     INTEGER NOT NULL,
    status           TEXT    NOT NULL CHECK (status IN ('running','paused','finished')),
    started_at       INTEGER NOT NULL,     -- epoch ms of first Start
    resumed_at       INTEGER,              -- epoch ms of the current running segment
    accumulated_ms   INTEGER NOT NULL DEFAULT 0,
    ended_at         INTEGER
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Applies pending migrations, each in its own transaction. Safe to call on every launch. */
export async function migrateDatabase(db: SqlDatabase): Promise<number> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  if (current > SCHEMA_VERSION) {
    throw new Error(`Database version ${current} is newer than this app (${SCHEMA_VERSION}).`);
  }
  while (current < SCHEMA_VERSION) {
    const migration = MIGRATIONS[current];
    if (migration === undefined) break;
    const next = current + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    current = next;
  }
  return current;
}
