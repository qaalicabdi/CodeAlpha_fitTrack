/**
 * Workout timer as a pure state machine. Elapsed time is always derived from wall-clock
 * timestamps (`Date.now()`), so it stays correct across re-renders, backgrounding and process
 * death — the UI merely re-reads it on an interval.
 */

export type TimerStatus = 'running' | 'paused' | 'finished';

export interface TimerState {
  status: TimerStatus;
  /** epoch ms of the first Start */
  startedAt: number;
  /** epoch ms when the current running segment began (null unless running) */
  resumedAt: number | null;
  /** completed running time before the current segment */
  accumulatedMs: number;
  /** epoch ms of Finish */
  endedAt: number | null;
}

export function startTimer(now: number): TimerState {
  return { status: 'running', startedAt: now, resumedAt: now, accumulatedMs: 0, endedAt: null };
}

export function elapsedMs(state: TimerState, now: number): number {
  if (state.status === 'running' && state.resumedAt !== null) {
    // Guard against the device clock moving backwards.
    return state.accumulatedMs + Math.max(0, now - state.resumedAt);
  }
  return state.accumulatedMs;
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', accumulatedMs: elapsedMs(state, now), resumedAt: null };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'paused') return state;
  return { ...state, status: 'running', resumedAt: now };
}

export function finishTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'finished') return state;
  return { ...state, status: 'finished', accumulatedMs: elapsedMs(state, now), resumedAt: null, endedAt: now };
}

/** "24:38" under an hour, "1:02:05" above. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
