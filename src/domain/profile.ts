import { heightToCm, weightToKg, type MeasurementUnit } from './format';

export const FITNESS_GOALS = ['stay_active', 'lose_weight', 'build_fitness', 'maintain_health'] as const;
export type FitnessGoal = (typeof FITNESS_GOALS)[number];

export const FITNESS_GOAL_LABEL: Record<FitnessGoal, string> = {
  stay_active: 'Stay Active',
  lose_weight: 'Lose Weight',
  build_fitness: 'Build Fitness',
  maintain_health: 'Maintain Health',
};

export interface UserProfile {
  fullName: string;
  age: number;
  weightKg: number;
  heightCm: number;
  fitnessGoal: FitnessGoal;
  photoUri: string | null;
}

export interface ProfileFormInput {
  fullName: string;
  age: string;
  weight: string;
  height: string;
  fitnessGoal: FitnessGoal | null;
}

export type ProfileFieldErrors = Partial<Record<'fullName' | 'age' | 'weight' | 'height' | 'fitnessGoal', string>>;

const NUMBER = /^\d+(\.\d+)?$/;

/** Validates the profile form (screens 05 and 22). Values are entered in the user's unit system. */
export function validateProfileForm(
  input: ProfileFormInput,
  unit: MeasurementUnit,
): { ok: true; value: Omit<UserProfile, 'photoUri'> } | { ok: false; errors: ProfileFieldErrors } {
  const errors: ProfileFieldErrors = {};
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (fullName.length === 0) errors.fullName = 'Enter your name.';
  else if (fullName.length > 60) errors.fullName = 'Keep it under 60 characters.';

  const age = Number(input.age.trim());
  if (!/^\d+$/.test(input.age.trim())) errors.age = 'Enter your age in years.';
  else if (age < 13 || age > 100) errors.age = 'Age must be between 13 and 100.';

  const weightRaw = input.weight.trim();
  const weightKg = weightToKg(Number(weightRaw), unit);
  if (!NUMBER.test(weightRaw)) errors.weight = 'Enter your weight.';
  else if (weightKg < 25 || weightKg > 300) errors.weight = unit === 'imperial' ? 'Use 55–660 lb.' : 'Use 25–300 kg.';

  const heightRaw = input.height.trim();
  const heightCm = heightToCm(Number(heightRaw), unit);
  if (!NUMBER.test(heightRaw)) errors.height = 'Enter your height.';
  else if (heightCm < 100 || heightCm > 250) errors.height = unit === 'imperial' ? 'Use 40–98 in.' : 'Use 100–250 cm.';

  if (input.fitnessGoal === null) errors.fitnessGoal = 'Choose what moves you.';

  if (Object.keys(errors).length > 0 || input.fitnessGoal === null) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName,
      age,
      weightKg: Math.round(weightKg * 10) / 10,
      heightCm: Math.round(heightCm * 10) / 10,
      fitnessGoal: input.fitnessGoal,
    },
  };
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}
