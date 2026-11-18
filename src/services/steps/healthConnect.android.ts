import {
  aggregateGroupByDuration,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { toHourKey } from '@/domain/dates';
import type { StepProvider } from './types';

let initialized = false;

async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  initialized = await initialize();
  return initialized;
}

async function hasStepsPermission(): Promise<boolean> {
  const granted = await getGrantedPermissions();
  return granted.some((p) => 'recordType' in p && p.recordType === 'Steps' && p.accessType === 'read');
}

/** Android Health Connect — reads steps recorded by the phone and connected apps/wearables. */
export const healthConnectProvider: StepProvider = {
  source: 'health_connect',
  name: 'Health Connect',
  async availability() {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'update_required';
    return 'unavailable';
  },
  async permission() {
    if (!(await ensureInitialized())) return 'denied';
    return (await hasStepsPermission()) ? 'granted' : 'undetermined';
  },
  async requestPermission() {
    if (!(await ensureInitialized())) return 'denied';
    await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    return (await hasStepsPermission()) ? 'granted' : 'denied';
  },
  async readHourly(from, to) {
    if (!(await ensureInitialized())) return [];
    // Buckets start at `from`, so it must sit on an hour boundary or every bucket straddles two hours.
    const start = new Date(from);
    start.setMinutes(0, 0, 0);
    const groups = await aggregateGroupByDuration({
      recordType: 'Steps',
      timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: to.toISOString() },
      timeRangeSlicer: { duration: 'HOURS', length: 1 },
    });
    // Zero hours are kept on purpose: if Samsung Health / another app later corrects or
    // de-duplicates an hour down to 0, the stale value we stored must be overwritten.
    return groups.map((g) => ({ hourStart: toHourKey(new Date(g.startTime)), steps: Math.round(g.result.COUNT_TOTAL ?? 0) }));
  },
  async openSettings() {
    openHealthConnectSettings();
  },
};
