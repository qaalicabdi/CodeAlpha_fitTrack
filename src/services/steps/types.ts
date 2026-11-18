import type { HourCount, StepSource } from '@/database/repositories/stepsRepository';

export type Availability = 'available' | 'unavailable' | 'update_required';
export type PermissionState = 'granted' | 'denied' | 'undetermined';

/**
 * A device data source for steps. Implementations never fabricate values: if the platform cannot
 * provide data they report `unavailable`, and the UI shows the permission/unavailable states.
 */
export interface StepProvider {
  source: StepSource;
  /** Shown in the UI, e.g. "Health Connect". */
  name: string;
  availability(): Promise<Availability>;
  permission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  /** Historical hourly totals (authoritative; re-reading the same hour returns the same total). */
  readHourly?: (from: Date, to: Date) => Promise<HourCount[]>;
  /** Live increments while the app is in the foreground. Returns an unsubscribe function. */
  watch?: (onDelta: (delta: number) => void) => () => void;
  /** Opens the OS / provider settings where access can be changed. */
  openSettings(): Promise<void>;
}
