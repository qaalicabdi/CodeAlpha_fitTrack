import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Current time, refreshed on an interval and when the app returns to the foreground. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [intervalMs]);
  return now;
}
