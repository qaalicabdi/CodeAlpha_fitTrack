/** Local-calendar helpers. All "date keys" are local `YYYY-MM-DD`; weeks run Monday–Sunday. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local hour bucket key, e.g. `2026-11-07T06:00`. */
export function toHourKey(d: Date): string {
  return `${toDateKey(d)}T${pad(d.getHours())}:00`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
}

export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7; // Monday = 0
  return addDays(day, -offset);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export interface DateRange {
  /** inclusive local date key */
  from: string;
  /** inclusive local date key */
  to: string;
}

export function dayRange(d: Date): DateRange {
  const key = toDateKey(d);
  return { from: key, to: key };
}

export function weekRange(d: Date): DateRange {
  const start = startOfWeek(d);
  return { from: toDateKey(start), to: toDateKey(addDays(start, 6)) };
}

export function monthRange(d: Date): DateRange {
  const start = startOfMonth(d);
  return { from: toDateKey(start), to: toDateKey(new Date(d.getFullYear(), d.getMonth(), daysInMonth(d))) };
}

/** Every date key from `from` to `to`, inclusive. */
export function eachDateKey(range: DateRange): string[] {
  const out: string[] = [];
  let cursor = fromDateKey(range.from);
  const end = fromDateKey(range.to);
  while (cursor.getTime() <= end.getTime()) {
    out.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = WEEKDAYS.map((w) => w.slice(0, 3));

/** "Saturday, November 7, 2026" */
export function formatLongDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Saturday, Nov 7, 2026" */
export function formatMediumDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "November 7, 2026" */
export function formatFullDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Saturday, Nov 7" */
export function formatWeekdayShort(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "Nov 7" */
export function formatMonthDay(d: Date): string {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "November 2026" */
export function formatMonthYear(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthName(d: Date): string {
  return MONTHS[d.getMonth()] ?? '';
}

/** "7:10 AM" */
export function formatTime(d: Date): string {
  const h = d.getHours();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Nov 2–8, 2026" or "Oct 27 – Nov 2, 2026" */
export function formatRange(range: DateRange): string {
  const a = fromDateKey(range.from);
  const b = fromDateKey(range.to);
  if (range.from === range.to) return formatMediumDate(a);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${MONTHS_SHORT[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`;
  }
  return `${formatMonthDay(a)} – ${formatMonthDay(b)}, ${b.getFullYear()}`;
}

/** "Today", "Yesterday", or "Fri, Nov 6" — used in history rows. */
export function formatRelativeDay(d: Date, now: Date): string {
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, addDays(now, -1))) return 'Yesterday';
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${formatMonthDay(d)}`;
}

export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}
