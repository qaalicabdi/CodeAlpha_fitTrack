/**
 * Workout categories from screen 10.
 *
 * MET values: 2024 Adult Compendium of Physical Activities (Herrmann et al.), gross METs:
 *  - walking 3.5   (walking, 2.8–3.4 mph, level, moderate pace)
 *  - running 8.3   (running, 5 mph / 12 min per mile)
 *  - cycling 7.5   (bicycling, general)
 *  - gym 5.0       (circuit / general gym training, moderate)
 *  - strength 5.0  (resistance training, multiple exercises, moderate-vigorous)
 *  - yoga 2.5      (yoga, Hatha)
 *  - other 4.0     (general moderate activity)
 *
 * Typical speeds (km/h) are only used to *estimate* session distance for distance-based activities.
 * Typical cadence (steps/min) is used to avoid counting a walk/run's steps twice in energy totals.
 */
export const ACTIVITY_TYPES = ['walking', 'running', 'cycling', 'gym', 'strength', 'yoga', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityTypeInfo {
  type: ActivityType;
  /** Label in the workout picker ("Gym Training"). */
  label: string;
  /** Default title for saved sessions ("Gym training"). */
  sessionTitle: string;
  /** Short filter-chip label in history. */
  filterLabel: string;
  met: number;
  speedKmh: number | null;
  cadence: number | null;
}

export const ACTIVITY_INFO: Record<ActivityType, ActivityTypeInfo> = {
  walking: { type: 'walking', label: 'Walking', sessionTitle: 'Walk', filterLabel: 'Walking', met: 3.5, speedKmh: 4.8, cadence: 100 },
  running: { type: 'running', label: 'Running', sessionTitle: 'Run', filterLabel: 'Running', met: 8.3, speedKmh: 8.3, cadence: 160 },
  cycling: { type: 'cycling', label: 'Cycling', sessionTitle: 'Ride', filterLabel: 'Cycling', met: 7.5, speedKmh: 19, cadence: null },
  gym: { type: 'gym', label: 'Gym Training', sessionTitle: 'Gym training', filterLabel: 'Gym', met: 5.0, speedKmh: null, cadence: null },
  strength: { type: 'strength', label: 'Strength Training', sessionTitle: 'Strength training', filterLabel: 'Gym', met: 5.0, speedKmh: null, cadence: null },
  yoga: { type: 'yoga', label: 'Yoga', sessionTitle: 'Yoga', filterLabel: 'Other', met: 2.5, speedKmh: null, cadence: null },
  other: { type: 'other', label: 'Other Activities', sessionTitle: 'Activity', filterLabel: 'Other', met: 4.0, speedKmh: null, cadence: null },
};

export function isActivityType(value: string): value is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}

/** "Morning walk", "Evening run", "Strength training" — matches the design's history copy. */
export function sessionDisplayName(type: ActivityType, start: Date): string {
  const info = ACTIVITY_INFO[type];
  if (type === 'walking' || type === 'running' || type === 'cycling') {
    const h = start.getHours();
    const part = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
    return `${part} ${info.sessionTitle.toLowerCase()}`;
  }
  return info.sessionTitle;
}

/** History filter chips (screen 20). */
export const HISTORY_FILTERS = ['all', 'walking', 'running', 'cycling', 'gym', 'other'] as const;
export type HistoryFilter = (typeof HISTORY_FILTERS)[number];

export const HISTORY_FILTER_LABEL: Record<HistoryFilter, string> = {
  all: 'All Activities',
  walking: 'Walking',
  running: 'Running',
  cycling: 'Cycling',
  gym: 'Gym',
  other: 'Other',
};

export function typesForFilter(filter: HistoryFilter): ActivityType[] {
  switch (filter) {
    case 'all':
      return [...ACTIVITY_TYPES];
    case 'gym':
      return ['gym', 'strength'];
    case 'other':
      return ['yoga', 'other'];
    default:
      return [filter];
  }
}
