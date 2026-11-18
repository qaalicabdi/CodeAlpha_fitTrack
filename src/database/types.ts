/**
 * The subset of expo-sqlite's `SQLiteDatabase` used by the app.
 * Keeping repositories on this interface lets Jest run the real SQL against better-sqlite3.
 */
export type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlParams): Promise<RunResult>;
  getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null>;
  getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
