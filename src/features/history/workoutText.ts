import { sessionDisplayName } from '@/domain/activityTypes';
import { formatRelativeDay, formatTime } from '@/domain/dates';
import { formatInt, formatMinutes } from '@/domain/format';
import type { Workout } from '@/database/repositories/workoutsRepository';

/** Copy for a workout in history rows: "Morning walk" / "32 min · 108 kcal" / "Today · 7:10 AM · Manual". */
export function workoutRowText(w: Workout, now: Date) {
  const start = new Date(w.startTime);
  return {
    title: sessionDisplayName(w.activityType, start),
    subtitle: `${formatMinutes(w.durationSeconds / 60)} · ${formatInt(w.caloriesBurned)} kcal`,
    meta: `${formatRelativeDay(start, now)} · ${formatTime(start)}${w.source === 'manual' ? ' · Manual' : ''}`,
  };
}
