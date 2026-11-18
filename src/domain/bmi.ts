/**
 * Body Mass Index (WHO adult classification). BMI = weight (kg) / height (m)².
 * It is a screening number, not a diagnosis — the UI says so. For people under 20 the adult
 * categories don't apply (BMI-for-age percentiles are used instead), so we only show the number.
 */

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese';

export const BMI_HEALTHY_MIN = 18.5;
export const BMI_HEALTHY_MAX = 24.9;
export const ADULT_BMI_AGE = 20;

export const BMI_CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: 'Underweight',
  healthy: 'Healthy weight',
  overweight: 'Overweight',
  obese: 'Obesity',
};

/** BMI rounded to one decimal, or null for invalid input. */
export function calculateBmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < BMI_HEALTHY_MIN) return 'underweight';
  if (bmi < 25) return 'healthy';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/** Weight range (kg) that gives a healthy BMI (18.5–24.9) at this height. */
export function healthyWeightRangeKg(heightCm: number): { minKg: number; maxKg: number } {
  const m2 = (heightCm / 100) ** 2;
  return { minKg: BMI_HEALTHY_MIN * m2, maxKg: BMI_HEALTHY_MAX * m2 };
}

/** Kg to gain (negative) or lose (positive) to reach the healthy range; 0 when already inside it. */
export function kgOutsideHealthyRange(weightKg: number, heightCm: number): number {
  const { minKg, maxKg } = healthyWeightRangeKg(heightCm);
  if (weightKg < minKg) return weightKg - minKg;
  if (weightKg > maxKg) return weightKg - maxKg;
  return 0;
}
