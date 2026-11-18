import {
  averageOfRecorded,
  blockLabel,
  computeDailyTotals,
  mergeHourlySources,
  peakBlock,
  percentChange,
  twoHourBlocks,
  stepsByHour,
  hourLabel,
  hourRangeLabel,
} from '../aggregation';
import { bmiCategory, calculateBmi, healthyWeightRangeKg, kgOutsideHealthyRange } from '../bmi';
import { estimateWorkoutCalories, estimateWorkoutDistanceM, resolveCalories, validateManualCalories } from '../calories';
import { eachDateKey, formatRange, monthRange, startOfWeek, toDateKey, weekRange } from '../dates';
import { formatInt, formatPercent, paceLabel } from '../format';
import { goalProgress, monthlyTargets, validateGoalTarget } from '../goals';
import { validateProfileForm } from '../profile';
import { elapsedMs, finishTimer, formatClock, pauseTimer, resumeTimer, startTimer } from '../timer';

const MIN = 60_000;

describe('workout timer', () => {
  it('derives elapsed time from timestamps', () => {
    const t0 = 1_000_000;
    const s = startTimer(t0);
    expect(elapsedMs(s, t0 + 5 * MIN)).toBe(5 * MIN);
  });

  it('freezes while paused and continues after resume', () => {
    const t0 = 0;
    let s = startTimer(t0);
    s = pauseTimer(s, t0 + 10 * MIN);
    expect(elapsedMs(s, t0 + 60 * MIN)).toBe(10 * MIN); // paused for 50 min — no change
    s = resumeTimer(s, t0 + 60 * MIN);
    expect(elapsedMs(s, t0 + 64 * MIN)).toBe(14 * MIN);
  });

  it('stays accurate across simulated backgrounding (no ticks between reads)', () => {
    const s = startTimer(0);
    expect(elapsedMs(s, 24 * MIN + 38_000)).toBe(24 * MIN + 38_000);
    expect(formatClock(elapsedMs(s, 24 * MIN + 38_000))).toBe('24:38');
  });

  it('finishes with the final elapsed time and ignores repeated transitions', () => {
    let s = startTimer(0);
    s = pauseTimer(s, 3 * MIN);
    s = pauseTimer(s, 9 * MIN); // second pause is a no-op
    s = finishTimer(s, 20 * MIN);
    expect(s.status).toBe('finished');
    expect(elapsedMs(s, 99 * MIN)).toBe(3 * MIN);
    expect(resumeTimer(s, 30 * MIN)).toBe(s);
  });

  it('never goes negative if the clock moves backwards', () => {
    const s = startTimer(10 * MIN);
    expect(elapsedMs(s, 5 * MIN)).toBe(0);
  });

  it('formats hours', () => {
    expect(formatClock(3_725_000)).toBe('1:02:05');
  });
});

describe('calorie estimation (MET)', () => {
  it('matches the design examples for a 72 kg profile', () => {
    expect(estimateWorkoutCalories('yoga', 20 * 60, 72)).toBe(60);
    expect(estimateWorkoutCalories('strength', 40 * 60, 72)).toBe(240);
  });

  it('scales with weight and duration', () => {
    expect(estimateWorkoutCalories('running', 3600, 80)).toBe(664);
    expect(estimateWorkoutCalories('running', 0, 80)).toBe(0);
  });

  it('estimates distance only for distance activities', () => {
    expect(estimateWorkoutDistanceM('running', 24 * 60 + 38)).toBeCloseTo(3407.6, 1);
    expect(estimateWorkoutDistanceM('yoga', 1200)).toBeNull();
  });

  it('records whether calories were manually adjusted', () => {
    expect(resolveCalories(60, null)).toEqual({ calories: 60, estimated: 60, manuallyAdjusted: false });
    expect(resolveCalories(60, 60).manuallyAdjusted).toBe(false);
    expect(resolveCalories(60, 75)).toEqual({ calories: 75, estimated: 60, manuallyAdjusted: true });
  });

  it('validates manual overrides', () => {
    expect(validateManualCalories('80')).toEqual({ ok: true, value: 80 });
    expect(validateManualCalories('').ok).toBe(false);
    expect(validateManualCalories('-5').ok).toBe(false);
    expect(validateManualCalories('abc').ok).toBe(false);
    expect(validateManualCalories('99999').ok).toBe(false);
  });
});

describe('daily aggregation', () => {
  const samples = [
    { source: 'health_connect', hourStart: '2026-11-07T06:00', steps: 2000 },
    { source: 'sensor', hourStart: '2026-11-07T06:00', steps: 1500 }, // same hour, other source
    { source: 'health_connect', hourStart: '2026-11-07T07:00', steps: 1950 },
    { source: 'health_connect', hourStart: '2026-11-07T08:00', steps: 3300 },
  ];

  it('takes the max per hour across sources instead of summing', () => {
    const merged = mergeHourlySources(samples);
    expect(merged.map((h) => h.steps)).toEqual([2000, 1950, 3300]);
    expect(merged.reduce((a, h) => a + h.steps, 0)).toBe(7250);
  });

  it('adds workout energy without double counting walk steps', () => {
    const hourly = mergeHourlySources(samples);
    const totals = computeDailyTotals({
      hourly,
      workouts: [{ activityType: 'walking', durationSeconds: 32 * 60, caloriesBurned: 108 }],
      weightKg: 72,
      heightCm: 178,
    });
    expect(totals.steps).toBe(7250);
    expect(totals.everydaySteps).toBe(7250 - 3200);
    expect(totals.activityEnergy).toBe(Math.round(108 + (7250 - 3200) * 0.00057 * 72));
    expect(totals.workoutMinutes).toBe(32);
    expect(totals.activeMinutes).toBe(32 + Math.round((7250 - 3200) / 100));
    expect(totals.distanceM).toBeCloseTo(7250 * 0.415 * 1.78, 5);
  });

  it('never adds steps for workouts and handles empty days', () => {
    const totals = computeDailyTotals({
      hourly: [],
      workouts: [{ activityType: 'yoga', durationSeconds: 1200, caloriesBurned: 60 }],
      weightKg: 72,
      heightCm: 178,
    });
    expect(totals).toMatchObject({ steps: 0, distanceM: 0, activityEnergy: 60, activeMinutes: 20, workoutCount: 1 });
  });

  it('builds 2-hour blocks and finds the peak', () => {
    const blocks = twoHourBlocks(mergeHourlySources(samples));
    expect(blocks).toHaveLength(12);
    expect(blocks[3]).toBe(3950);
    expect(peakBlock(blocks)).toBe(3);
    expect(blockLabel(3)).toBe('6–8 AM');
    expect(blockLabel(5)).toBe('10 AM–12 PM');
    expect(peakBlock(new Array(12).fill(0))).toBe(-1);
  });

  it('prefers Health Connect over the raw sensor for the same hour', () => {
    const merged = mergeHourlySources([
      { source: 'sensor', hourStart: '2026-11-10T09:00', steps: 1500 },
      { source: 'health_connect', hourStart: '2026-11-10T09:00', steps: 1032 },
      { source: 'sensor', hourStart: '2026-11-10T10:00', steps: 40 },
    ]);
    expect(merged.map((h) => h.steps)).toEqual([1032, 40]);
  });

  it('labels hours and hour ranges', () => {
    expect(stepsByHour(mergeHourlySources(samples))[7]).toBe(1950);
    expect(hourLabel(0)).toBe('12 AM');
    expect(hourLabel(13)).toBe('1 PM');
    expect(hourRangeLabel(9)).toBe('9:00 – 10:00 AM');
    expect(hourRangeLabel(11)).toBe('11:00 AM – 12:00 PM');
    expect(hourRangeLabel(23)).toBe('11:00 PM – 12:00 AM');
  });

  it('averages only recorded days', () => {
    expect(averageOfRecorded([8000, 9000, 0, 7000])).toEqual({ average: 8000, recordedDays: 3 });
    expect(averageOfRecorded([0, 0])).toEqual({ average: 0, recordedDays: 0 });
    expect(percentChange(112.4, 100)).toBeCloseTo(12.4);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe('goals', () => {
  it('computes progress and remaining', () => {
    const p = goalProgress(7250, 10000);
    expect(p).toMatchObject({ percent: 72.5, ratio: 0.725, remaining: 2750, complete: false });
    expect(goalProgress(12000, 10000)).toMatchObject({ ratio: 1, remaining: 0, complete: true });
    expect(formatPercent(goalProgress(7250, 12000).percent)).toBe('60.4%');
    expect(formatPercent(75)).toBe('75%');
  });

  it('validates targets against the suggested range', () => {
    expect(validateGoalTarget('daily_steps', '12,000')).toEqual({ ok: true, value: 12000 });
    expect(validateGoalTarget('daily_steps', '500').ok).toBe(false);
    expect(validateGoalTarget('weekly_workouts', '2.5').ok).toBe(false);
  });

  it('derives monthly targets', () => {
    expect(monthlyTargets({ daily_steps: 10000, weekly_workouts: 4, daily_energy: 500, weekly_active_minutes: 180 })).toEqual({
      workouts: 16,
      activeMinutes: 720,
      steps: 300000,
    });
  });
});

describe('dates and formatting', () => {
  const sat = new Date(2026, 10, 7, 9, 41);

  it('uses Monday-first weeks', () => {
    expect(toDateKey(startOfWeek(sat))).toBe('2026-11-02');
    expect(weekRange(sat)).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(formatRange(weekRange(sat))).toBe('Nov 2–8, 2026');
    expect(monthRange(sat)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(eachDateKey(weekRange(sat))).toHaveLength(7);
  });

  it('formats numbers and pace', () => {
    expect(formatInt(45350)).toBe('45,350');
    expect(formatInt(-1200)).toBe('-1,200');
    expect(paceLabel(24 * 60 + 38, 3400, 'metric')).toBe('7:15 / km');
  });
});

describe('profile validation', () => {
  it('accepts a valid metric form', () => {
    const r = validateProfileForm({ fullName: '  Alex   Morgan ', age: '29', weight: '72', height: '178', fitnessGoal: 'build_fitness' }, 'metric');
    expect(r).toEqual({ ok: true, value: { fullName: 'Alex Morgan', age: 29, weightKg: 72, heightCm: 178, fitnessGoal: 'build_fitness' } });
  });

  it('converts imperial input', () => {
    const r = validateProfileForm({ fullName: 'Sam', age: '40', weight: '160', height: '70', fitnessGoal: 'stay_active' }, 'imperial');
    expect(r.ok && r.value.weightKg).toBeCloseTo(72.6, 1);
    expect(r.ok && r.value.heightCm).toBeCloseTo(177.8, 1);
  });

  it('reports field errors', () => {
    const r = validateProfileForm({ fullName: '', age: '9', weight: 'x', height: '400', fitnessGoal: null }, 'metric');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['age', 'fitnessGoal', 'fullName', 'height', 'weight']);
  });
});

describe('bmi', () => {
  it('calculates BMI from kg and cm', () => {
    expect(calculateBmi(72, 178)).toBe(22.7);
    expect(calculateBmi(0, 178)).toBeNull();
  });

  it('uses the WHO adult cut-offs', () => {
    expect(bmiCategory(18.4)).toBe('underweight');
    expect(bmiCategory(18.5)).toBe('healthy');
    expect(bmiCategory(24.9)).toBe('healthy');
    expect(bmiCategory(25)).toBe('overweight');
    expect(bmiCategory(30)).toBe('obese');
  });

  it('gives the healthy range and the distance to it', () => {
    const r = healthyWeightRangeKg(170);
    expect(r.minKg).toBeCloseTo(53.5, 1);
    expect(r.maxKg).toBeCloseTo(72.0, 1);
    expect(kgOutsideHealthyRange(65, 170)).toBe(0);
    expect(kgOutsideHealthyRange(80, 170)).toBeCloseTo(8.0, 1);
    expect(kgOutsideHealthyRange(50, 170)).toBeCloseTo(-3.5, 1);
  });
});
