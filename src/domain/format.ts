/** Number/unit formatting shared by all screens. Hand-rolled so output is identical on Hermes and web. */

export type MeasurementUnit = 'metric' | 'imperial';

export function formatInt(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** One decimal, trailing ".0" dropped: 72.5 → "72.5", 75 → "75". */
export function formatPercent(percent: number): string {
  const v = Math.round(percent * 10) / 10;
  return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)}%`;
}

export function formatDecimal(n: number, digits = 1): string {
  return n.toFixed(digits);
}

const KM_PER_MILE = 1.609344;
const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export function distanceValue(meters: number, unit: MeasurementUnit): { value: string; unit: string } {
  if (unit === 'imperial') return { value: formatDecimal(meters / 1000 / KM_PER_MILE), unit: 'mi' };
  return { value: formatDecimal(meters / 1000), unit: 'km' };
}

export function paceLabel(durationSeconds: number, meters: number, unit: MeasurementUnit): string | null {
  if (!(meters > 0) || !(durationSeconds > 0)) return null;
  const perUnit = unit === 'imperial' ? meters / 1000 / KM_PER_MILE : meters / 1000;
  const secondsPer = durationSeconds / perUnit;
  const m = Math.floor(secondsPer / 60);
  const s = Math.round(secondsPer % 60);
  const mm = s === 60 ? m + 1 : m;
  const ss = s === 60 ? 0 : s;
  return `${mm}:${String(ss).padStart(2, '0')} / ${unit === 'imperial' ? 'mi' : 'km'}`;
}

export function weightDisplay(kg: number, unit: MeasurementUnit): { value: string; unit: string } {
  return unit === 'imperial' ? { value: String(Math.round(kg / KG_PER_LB)), unit: 'lb' } : { value: String(Math.round(kg)), unit: 'kg' };
}

export function heightDisplay(cm: number, unit: MeasurementUnit): { value: string; unit: string } {
  return unit === 'imperial' ? { value: String(Math.round(cm / CM_PER_IN)), unit: 'in' } : { value: String(Math.round(cm)), unit: 'cm' };
}

export function weightToKg(value: number, unit: MeasurementUnit): number {
  return unit === 'imperial' ? value * KG_PER_LB : value;
}

export function heightToCm(value: number, unit: MeasurementUnit): number {
  return unit === 'imperial' ? value * CM_PER_IN : value;
}

/** "32 min" / "1 h 05 min" */
export function formatMinutes(totalMinutes: number): string {
  const m = Math.round(totalMinutes);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export function pluralize(n: number, one: string, many: string): string {
  return `${formatInt(n)} ${n === 1 ? one : many}`;
}
