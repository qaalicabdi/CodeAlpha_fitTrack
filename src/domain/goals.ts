export const GOAL_TYPES = ['daily_steps', 'weekly_workouts', 'daily_energy', 'weekly_active_minutes'] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export interface GoalDefinition {
  type: GoalType;
  title: string;
  sheetTitle: string;
  unit: string;
  period: 'day' | 'week';
  min: number;
  max: number;
  step: number;
  defaultTarget: number;
}

/** Ranges follow the Edit Goal sheet ("Suggested range: 3,000–20,000 steps"). */
export const GOAL_DEFINITIONS: Record<GoalType, GoalDefinition> = {
  daily_steps: { type: 'daily_steps', title: 'Daily steps', sheetTitle: 'Edit daily step goal', unit: 'steps', period: 'day', min: 3000, max: 20000, step: 500, defaultTarget: 10000 },
  weekly_workouts: { type: 'weekly_workouts', title: 'Weekly workouts', sheetTitle: 'Edit weekly workout goal', unit: 'workouts', period: 'week', min: 1, max: 14, step: 1, defaultTarget: 4 },
  daily_energy: { type: 'daily_energy', title: 'Daily activity energy', sheetTitle: 'Edit daily energy goal', unit: 'kcal', period: 'day', min: 100, max: 2000, step: 50, defaultTarget: 500 },
  weekly_active_minutes: { type: 'weekly_active_minutes', title: 'Weekly active minutes', sheetTitle: 'Edit weekly active minutes', unit: 'min', period: 'week', min: 30, max: 1500, step: 10, defaultTarget: 180 },
};

export interface GoalProgress {
  current: number;
  target: number;
  /** 0..1 for progress bars */
  ratio: number;
  /** unclamped percent for labels (e.g. 72.5) */
  percent: number;
  remaining: number;
  complete: boolean;
}

export function goalProgress(current: number, target: number): GoalProgress {
  const safeTarget = target > 0 ? target : 1;
  const percent = (current / safeTarget) * 100;
  return {
    current,
    target,
    ratio: Math.max(0, Math.min(1, current / safeTarget)),
    percent,
    remaining: Math.max(0, target - current),
    complete: current >= target,
  };
}

export type GoalValidation = { ok: true; value: number } | { ok: false; message: string };

export function validateGoalTarget(type: GoalType, input: string): GoalValidation {
  const def = GOAL_DEFINITIONS[type];
  const cleaned = input.replace(/[,\s]/g, '');
  if (cleaned === '') return { ok: false, message: 'Enter a target.' };
  if (!/^\d+$/.test(cleaned)) return { ok: false, message: 'Use whole numbers only.' };
  const value = Number(cleaned);
  if (value < def.min || value > def.max) {
    return { ok: false, message: `Choose between ${def.min.toLocaleString('en-US')} and ${def.max.toLocaleString('en-US')} ${def.unit}.` };
  }
  return { ok: true, value };
}

/** Monthly targets as described on screen 18: 4 workout weeks and 30 daily step goals. */
export function monthlyTargets(goals: Record<GoalType, number>) {
  return {
    workouts: goals.weekly_workouts * 4,
    activeMinutes: goals.weekly_active_minutes * 4,
    steps: goals.daily_steps * 30,
  };
}
