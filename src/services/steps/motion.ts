import { Pedometer } from 'expo-sensors';
import { Linking } from 'react-native';

import { addDays, toHourKey } from '@/domain/dates';
import type { PermissionState, StepProvider } from './types';

async function mapPermission(): Promise<PermissionState> {
  const p = await Pedometer.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * iOS Core Motion (CMPedometer). Provides true historical counts for the last 7 days, queried
 * hour by hour.
 */
export const coreMotionProvider: StepProvider = {
  source: 'core_motion',
  name: 'Motion & Fitness',
  async availability() {
    return (await Pedometer.isAvailableAsync()) ? 'available' : 'unavailable';
  },
  permission: mapPermission,
  async requestPermission() {
    const p = await Pedometer.requestPermissionsAsync();
    return p.granted ? 'granted' : 'denied';
  },
  async readHourly(from, to) {
    const earliest = addDays(to, -7);
    let cursor = new Date(Math.max(from.getTime(), earliest.getTime()));
    cursor.setMinutes(0, 0, 0);
    const out: { hourStart: string; steps: number }[] = [];
    while (cursor.getTime() < to.getTime()) {
      const next = new Date(cursor.getTime() + 3_600_000);
      const end = next.getTime() > to.getTime() ? to : next;
      const { steps } = await Pedometer.getStepCountAsync(cursor, end);
      if (steps > 0) out.push({ hourStart: toHourKey(cursor), steps });
      cursor = next;
    }
    return out;
  },
  async openSettings() {
    await Linking.openSettings();
  },
};

/**
 * Android TYPE_STEP_COUNTER via expo-sensors. Fallback when Health Connect is unavailable:
 * counts steps only while the app is open (documented limitation — no fabricated backfill).
 */
export const stepSensorProvider: StepProvider = {
  source: 'sensor',
  name: 'Device step sensor',
  async availability() {
    return (await Pedometer.isAvailableAsync()) ? 'available' : 'unavailable';
  },
  permission: mapPermission,
  async requestPermission() {
    const p = await Pedometer.requestPermissionsAsync();
    return p.granted ? 'granted' : 'denied';
  },
  watch(onDelta) {
    let last: number | null = null;
    const sub = Pedometer.watchStepCount(({ steps }) => {
      // `steps` is cumulative since this subscription started.
      const delta = last === null ? steps : steps - last;
      last = steps;
      if (delta > 0) onDelta(delta);
    });
    return () => sub.remove();
  },
  async openSettings() {
    await Linking.openSettings();
  },
};
