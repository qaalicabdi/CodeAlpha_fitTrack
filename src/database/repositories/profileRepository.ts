import type { FitnessGoal, UserProfile } from '@/domain/profile';
import type { SqlDatabase } from '../types';

interface ProfileRow {
  full_name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  fitness_goal: FitnessGoal;
  photo_uri: string | null;
}

export async function getProfile(db: SqlDatabase): Promise<UserProfile | null> {
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT full_name, age, weight_kg, height_cm, fitness_goal, photo_uri FROM user_profile WHERE id = 1',
  );
  if (!row) return null;
  return {
    fullName: row.full_name,
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    fitnessGoal: row.fitness_goal,
    photoUri: row.photo_uri,
  };
}

export async function saveProfile(db: SqlDatabase, profile: UserProfile, now = new Date()): Promise<void> {
  const ts = now.toISOString();
  await db.runAsync(
    `INSERT INTO user_profile (id, full_name, age, weight_kg, height_cm, fitness_goal, photo_uri, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       full_name = excluded.full_name, age = excluded.age, weight_kg = excluded.weight_kg,
       height_cm = excluded.height_cm, fitness_goal = excluded.fitness_goal,
       photo_uri = excluded.photo_uri, updated_at = excluded.updated_at`,
    [profile.fullName, profile.age, profile.weightKg, profile.heightCm, profile.fitnessGoal, profile.photoUri, ts, ts],
  );
}
