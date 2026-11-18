import { Platform } from 'react-native';

import { healthConnectProvider } from './healthConnect';
import { coreMotionProvider, stepSensorProvider } from './motion';
import type { StepProvider } from './types';

/**
 * Picks the best step source for this device:
 *  - iOS: Core Motion.
 *  - Android: Health Connect when installed/available, otherwise the live step-counter sensor.
 *  - Web: none (the app works with manual logging only).
 */
export async function resolveStepProvider(): Promise<StepProvider | null> {
  if (Platform.OS === 'ios') return coreMotionProvider;
  if (Platform.OS === 'android') {
    if (healthConnectProvider) {
      try {
        if ((await healthConnectProvider.availability()) === 'available') return healthConnectProvider;
      } catch {
        // Health Connect not installed / not supported → fall back to the sensor.
      }
    }
    return stepSensorProvider;
  }
  return null;
}

export type { StepProvider, Availability, PermissionState } from './types';
