import { GOAL_DEFINITIONS, GOAL_TYPES, type GoalType } from '@/domain/goals';
import type { SqlDatabase } from '../types';

export type GoalTargets = Record<GoalType, number>;

export async function getGoalTargets(db: SqlDatabase): Promise<GoalTargets> {
  const rows = await db.getAllAsync<{ goal_type: GoalType; target_value: number }>(
    'SELECT goal_type, target_value FROM goals WHERE is_active = 1',
  );
  const targets = Object.fromEntries(GOAL_TYPES.map((t) => [t, GOAL_DEFINITIONS[t].defaultTarget])) as GoalTargets;
  for (const r of rows) targets[r.goal_type] = r.target_value;
  return targets;
}

export async function setGoalTarget(db: SqlDatabase, type: GoalType, target: number, now = new Date()): Promise<void> {
  const def = GOAL_DEFINITIONS[type];
  if (!(target >= def.min && target <= def.max)) {
    throw new RangeError(`${type} target must be between ${def.min} and ${def.max}`);
  }
  const ts = now.toISOString();
  await db.runAsync(
    `INSERT INTO goals (goal_type, target_value, period, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)
     ON CONFLICT(goal_type) DO UPDATE SET target_value = excluded.target_value, is_active = 1, updated_at = excluded.updated_at`,
    [type, target, def.period, ts, ts],
  );
}
