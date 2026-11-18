import Database from 'better-sqlite3';

import { migrateDatabase } from '@/database/migrations';
import type { RunResult, SqlDatabase, SqlParams } from '@/database/types';

/** In-memory SQLite (better-sqlite3) behind the same interface the app uses with expo-sqlite. */
export function createTestDatabase(): SqlDatabase & { close(): void } {
  const raw = new Database(':memory:');
  let depth = 0;
  return {
    async execAsync(source: string) {
      raw.exec(source);
    },
    async runAsync(source: string, params: SqlParams = []): Promise<RunResult> {
      const r = raw.prepare(source).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    async getFirstAsync<T>(source: string, params: SqlParams = []) {
      const stmt = raw.prepare(source);
      return ((stmt.reader ? stmt.get(...params) : undefined) ?? null) as T | null;
    },
    async getAllAsync<T>(source: string, params: SqlParams = []) {
      return raw.prepare(source).all(...params) as T[];
    },
    async withTransactionAsync(task: () => Promise<void>) {
      // Nested calls join the outer transaction (same semantics as expo-sqlite's non-exclusive API).
      if (depth > 0) {
        depth++;
        try {
          await task();
        } finally {
          depth--;
        }
        return;
      }
      raw.exec('BEGIN');
      depth = 1;
      try {
        await task();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      } finally {
        depth = 0;
      }
    },
    close() {
      raw.close();
    },
  };
}

export async function createMigratedDatabase() {
  const db = createTestDatabase();
  await migrateDatabase(db);
  return db;
}
