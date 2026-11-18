import { validateManualCalories } from './calories';

export const MAX_MANUAL_DURATION_MIN = 600;

export type ManualEntryErrors = Partial<Record<'duration' | 'calories' | 'start', string>>;

/** Validates the manual logging form (screen 14 + "Manual form validation" state). */
export function validateManualEntry(input: {
  durationText: string;
  caloriesText: string;
  caloriesOverridden: boolean;
  start: Date;
  now: Date;
}): { ok: true; durationMinutes: number; caloriesOverride: number | null } | { ok: false; errors: ManualEntryErrors } {
  const errors: ManualEntryErrors = {};
  const d = input.durationText.trim();
  let durationMinutes = 0;
  if (d === '') errors.duration = 'Duration is required. Enter at least 1 minute.';
  else if (!/^\d+$/.test(d)) errors.duration = 'Enter whole minutes.';
  else {
    durationMinutes = Number(d);
    if (durationMinutes < 1) errors.duration = 'Duration is required. Enter at least 1 minute.';
    else if (durationMinutes > MAX_MANUAL_DURATION_MIN) errors.duration = `Enter at most ${MAX_MANUAL_DURATION_MIN} minutes.`;
  }

  if (input.start.getTime() > input.now.getTime()) errors.start = "Start time can't be in the future.";

  let caloriesOverride: number | null = null;
  if (input.caloriesOverridden) {
    const c = validateManualCalories(input.caloriesText);
    if (!c.ok) errors.calories = c.message;
    else caloriesOverride = c.value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, durationMinutes, caloriesOverride };
}

/** Parses the duration field for live estimates; null when not a valid duration yet. */
export function parseDurationMinutes(text: string): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= MAX_MANUAL_DURATION_MIN ? n : null;
}
