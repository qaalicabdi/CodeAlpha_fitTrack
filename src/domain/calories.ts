import { ACTIVITY_INFO, type ActivityType } from './activityTypes';

/**
 * Energy estimation. These are estimates, not measurements — the UI always labels them as such.
 *
 * Workouts: MET method, kcal = MET × body mass (kg) × duration (h).
 * Everyday steps: ≈0.57 kcal per km per kg is a common walking approximation; per step we use
 *   kcal/step = 0.00057 × weightKg  (≈0.041 kcal/step at 72 kg).
 */

export const STEP_KCAL_PER_KG = 0.00057;

export const MANUAL_CALORIES_MAX = 5000;

export function estimateWorkoutCalories(type: ActivityType, durationSeconds: number, weightKg: number): number {
  if (!(durationSeconds > 0) || !(weightKg > 0)) return 0;
  const hours = durationSeconds / 3600;
  return Math.round(ACTIVITY_INFO[type].met * weightKg * hours);
}

export function estimateStepCalories(steps: number, weightKg: number): number {
  if (!(steps > 0) || !(weightKg > 0)) return 0;
  return steps * STEP_KCAL_PER_KG * weightKg;
}

/** Estimated session distance in metres for distance-based activities, otherwise null. */
export function estimateWorkoutDistanceM(type: ActivityType, durationSeconds: number): number | null {
  const speed = ACTIVITY_INFO[type].speedKmh;
  if (speed === null || !(durationSeconds > 0)) return null;
  return (speed * 1000 * durationSeconds) / 3600;
}

export type CalorieValidation = { ok: true; value: number } | { ok: false; message: string };

/** Validates a manual calorie override typed by the user. */
export function validateManualCalories(input: string): CalorieValidation {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, message: 'Calories are required.' };
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return { ok: false, message: 'Enter a whole number of kcal.' };
  const value = Math.round(Number(trimmed));
  if (value > MANUAL_CALORIES_MAX) return { ok: false, message: `Enter at most ${MANUAL_CALORIES_MAX.toLocaleString('en-US')} kcal.` };
  return { ok: true, value };
}

export interface ResolvedCalories {
  calories: number;
  estimated: number;
  manuallyAdjusted: boolean;
}

/** Combines the estimate with an optional override, preserving whether the user changed it. */
export function resolveCalories(estimated: number, override: number | null): ResolvedCalories {
  if (override === null || override === estimated) {
    return { calories: estimated, estimated, manuallyAdjusted: false };
  }
  return { calories: override, estimated, manuallyAdjusted: true };
}
