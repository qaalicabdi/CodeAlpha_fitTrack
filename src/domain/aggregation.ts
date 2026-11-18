import { ACTIVITY_INFO, type ActivityType } from './activityTypes';
import { estimateStepCalories } from './calories';

/**
 * Daily totals are derived from two independent inputs:
 *   1. hourly step buckets (device data, possibly from several sources), and
 *   2. saved workouts (timer or manual).
 *
 * Rules (also shown to users on screens 08/10 and the "saved feedback" state):
 *   - Steps and distance come only from device data. Workouts never add steps.
 *   - When several sources report the same hour, the largest value is used (they observe the
 *     same steps), so nothing is counted twice.
 *   - Activity energy = workout calories + energy of everyday steps. Steps that a walk/run
 *     workout most likely produced are removed from "everyday" so they are not counted twice.
 *   - Active minutes = workout minutes + everyday active minutes, where everyday active minutes
 *     are estimated from purposeful walking: steps in hours with ≥ 1,000 steps at 100 steps/min.
 */

export interface StepSample {
  source: string;
  hourStart: string; // 'YYYY-MM-DDTHH:00'
  steps: number;
}

export interface HourlySteps {
  hourStart: string;
  hour: number;
  steps: number;
}

export const PURPOSEFUL_HOUR_THRESHOLD = 1000;
export const MODERATE_CADENCE = 100;

/** Sources that report the full, de-duplicated record for an hour (not just foreground counting). */
const AUTHORITATIVE_SOURCES = new Set(['health_connect', 'core_motion']);

/**
 * Merges multiple sources per hour. Health Connect / Core Motion are the source of truth: when
 * one of them reports an hour, the foreground-only `sensor` count for that hour is ignored (the
 * raw phone sensor over-counts and would otherwise inflate the day). Between sources of the same
 * kind the largest value wins. Returns hours sorted ascending.
 */
export function mergeHourlySources(samples: readonly StepSample[]): HourlySteps[] {
  const byHour = new Map<string, { steps: number; authoritative: boolean }>();
  for (const s of samples) {
    const authoritative = AUTHORITATIVE_SOURCES.has(s.source);
    const prev = byHour.get(s.hourStart);
    if (!prev || (authoritative && !prev.authoritative) || (authoritative === prev.authoritative && s.steps > prev.steps)) {
      byHour.set(s.hourStart, { steps: s.steps, authoritative });
    }
  }
  return [...byHour.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hourStart, v]) => ({ hourStart, hour: Number(hourStart.slice(11, 13)), steps: v.steps }));
}

/** Stride length estimate (m) from height — 0.415 × height is the common walking approximation. */
export function strideLengthM(heightCm: number): number {
  return (heightCm * 0.415) / 100;
}

export function stepsToDistanceM(steps: number, heightCm: number): number {
  if (!(steps > 0) || !(heightCm > 0)) return 0;
  return steps * strideLengthM(heightCm);
}

export interface WorkoutForTotals {
  activityType: ActivityType;
  durationSeconds: number;
  caloriesBurned: number;
}

export interface DailyTotals {
  steps: number;
  distanceM: number;
  activityEnergy: number;
  activeMinutes: number;
  workoutCalories: number;
  workoutMinutes: number;
  everydaySteps: number;
  everydayActiveMinutes: number;
  workoutCount: number;
}

export function computeDailyTotals(input: {
  hourly: readonly HourlySteps[];
  workouts: readonly WorkoutForTotals[];
  weightKg: number;
  heightCm: number;
}): DailyTotals {
  const steps = input.hourly.reduce((sum, h) => sum + h.steps, 0);

  let workoutCalories = 0;
  let workoutSeconds = 0;
  let attributedSteps = 0;
  for (const w of input.workouts) {
    workoutCalories += w.caloriesBurned;
    workoutSeconds += w.durationSeconds;
    const cadence = ACTIVITY_INFO[w.activityType].cadence;
    if (cadence !== null) attributedSteps += (w.durationSeconds / 60) * cadence;
  }
  attributedSteps = Math.min(steps, Math.round(attributedSteps));
  const everydaySteps = steps - attributedSteps;

  // Purposeful steps in busy hours, minus whatever workouts already account for.
  const purposefulSteps = input.hourly
    .filter((h) => h.steps >= PURPOSEFUL_HOUR_THRESHOLD)
    .reduce((sum, h) => sum + h.steps, 0);
  const everydayPurposeful = Math.max(0, purposefulSteps - attributedSteps);
  const everydayActiveMinutes = Math.round(everydayPurposeful / MODERATE_CADENCE);
  const workoutMinutes = Math.round(workoutSeconds / 60);

  return {
    steps,
    distanceM: stepsToDistanceM(steps, input.heightCm),
    activityEnergy: Math.round(workoutCalories + estimateStepCalories(everydaySteps, input.weightKg)),
    activeMinutes: workoutMinutes + everydayActiveMinutes,
    workoutCalories: Math.round(workoutCalories),
    workoutMinutes,
    everydaySteps,
    everydayActiveMinutes,
    workoutCount: input.workouts.length,
  };
}

/** Groups hourly steps into 2-hour blocks (0h, 2h … 22h) for the "Movement by hour" chart. */
export function twoHourBlocks(hourly: readonly HourlySteps[]): number[] {
  const blocks = new Array<number>(12).fill(0);
  for (const h of hourly) {
    const i = Math.floor(h.hour / 2);
    blocks[i] = (blocks[i] ?? 0) + h.steps;
  }
  return blocks;
}

/** Index of the busiest block, or -1 if there were no steps. */
export function peakBlock(blocks: readonly number[]): number {
  let best = -1;
  let bestValue = 0;
  blocks.forEach((v, i) => {
    if (v > bestValue) {
      best = i;
      bestValue = v;
    }
  });
  return best;
}

/** "6–8 AM" for block 3. */
export function blockLabel(index: number): string {
  const fmt = (h: number) => {
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return { hour12, suffix: h < 12 || h === 24 ? 'AM' : 'PM' };
  };
  const a = fmt(index * 2);
  const b = fmt((index * 2 + 2) % 24 === 0 ? 24 : index * 2 + 2);
  return a.suffix === b.suffix ? `${a.hour12}–${b.hour12} ${b.suffix}` : `${a.hour12} ${a.suffix}–${b.hour12} ${b.suffix}`;
}

/** Steps per clock hour (index 0–23). */
export function stepsByHour(hourly: readonly HourlySteps[]): number[] {
  const out = new Array<number>(24).fill(0);
  for (const h of hourly) out[h.hour] = (out[h.hour] ?? 0) + h.steps;
  return out;
}

/** "9 AM", "12 PM" */
export function hourLabel(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  return `${hh % 12 === 0 ? 12 : hh % 12} ${hh < 12 ? 'AM' : 'PM'}`;
}

/** "9:00 – 10:00 AM", "11:00 AM – 12:00 PM" for hour 9 / 11. */
export function hourRangeLabel(h: number): string {
  const fmt = (x: number) => ({ t: `${x % 12 === 0 ? 12 : x % 12}:00`, s: x % 24 < 12 ? 'AM' : 'PM' });
  const a = fmt(h);
  const b = fmt(h + 1);
  return a.s === b.s ? `${a.t} – ${b.t} ${b.s}` : `${a.t} ${a.s} – ${b.t} ${b.s}`;
}

/** Average over days that have data (design: "7,558 daily average · 6 days recorded"). */
export function averageOfRecorded(values: readonly number[]): { average: number; recordedDays: number } {
  const recorded = values.filter((v) => v > 0);
  if (recorded.length === 0) return { average: 0, recordedDays: 0 };
  return { average: Math.round(recorded.reduce((a, b) => a + b, 0) / recorded.length), recordedDays: recorded.length };
}

/** Relative change in percent, or null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!(previous > 0)) return null;
  return ((current - previous) / previous) * 100;
}
