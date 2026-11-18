import type { MeasurementUnit } from '@/domain/format';
import type { SqlDatabase } from '../types';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemePreference;
  measurementUnit: MeasurementUnit;
  notificationsEnabled: boolean;
  stepTrackingEnabled: boolean;
  onboardingCompleted: boolean;
}

interface SettingsRow {
  theme: ThemePreference;
  measurement_unit: MeasurementUnit;
  notifications_enabled: number;
  step_tracking_enabled: number;
  onboarding_completed: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  measurementUnit: 'metric',
  notificationsEnabled: true,
  stepTrackingEnabled: false,
  onboardingCompleted: false,
};

export async function getSettings(db: SqlDatabase): Promise<AppSettings> {
  const row = await db.getFirstAsync<SettingsRow>(
    'SELECT theme, measurement_unit, notifications_enabled, step_tracking_enabled, onboarding_completed FROM app_settings WHERE id = 1',
  );
  if (!row) return DEFAULT_SETTINGS;
  return {
    theme: row.theme,
    measurementUnit: row.measurement_unit,
    notificationsEnabled: row.notifications_enabled === 1,
    stepTrackingEnabled: row.step_tracking_enabled === 1,
    onboardingCompleted: row.onboarding_completed === 1,
  };
}

const COLUMN: Record<keyof AppSettings, string> = {
  theme: 'theme',
  measurementUnit: 'measurement_unit',
  notificationsEnabled: 'notifications_enabled',
  stepTrackingEnabled: 'step_tracking_enabled',
  onboardingCompleted: 'onboarding_completed',
};

export async function updateSettings(db: SqlDatabase, patch: Partial<AppSettings>, now = new Date()): Promise<void> {
  const entries = (Object.keys(patch) as (keyof AppSettings)[]).filter((k) => patch[k] !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map((k) => `${COLUMN[k]} = ?`).join(', ');
  const values = entries.map((k) => {
    const v = patch[k];
    return typeof v === 'boolean' ? (v ? 1 : 0) : (v as string);
  });
  await db.runAsync(`UPDATE app_settings SET ${sets}, updated_at = ? WHERE id = 1`, [...values, now.toISOString()]);
}
