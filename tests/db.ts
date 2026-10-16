import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import type { Env } from '../worker/types';
export function environment(profile = 'newsletter') {
  const database = new DatabaseSync(':memory:');
  database.exec(readFileSync('migrations/0001_initial.sql', 'utf8'));
  class Statement {
    values: (string | number | null)[] = [];
    constructor(readonly sql: string) {}
    bind(...values: (string | number | null)[]) {
      this.values = values;
      return this;
    }
    async first() {
      return database.prepare(this.sql).get(...this.values) || null;
    }
    async all() {
      return { results: database.prepare(this.sql).all(...this.values), success: true };
    }
    async run() {
      const result = database.prepare(this.sql).run(...this.values);
      return { success: true, meta: { changes: result.changes } };
    }
  }
  const db = {
    prepare: (sql: string) => new Statement(sql),
    batch: async (statements: Statement[]) => {
      database.exec('BEGIN');
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        database.exec('COMMIT');
        return results;
      } catch (e) {
        database.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return {
    env: {
      DB: db,
      ENVIRONMENT: 'local',
      PROFILE: profile,
      SITE_URL: 'https://example.com',
      LOCAL_ORIGINS: '["http://127.0.0.1:4433","http://127.0.0.1:8899"]',
      LOCAL_SITE_URL: 'http://127.0.0.1:4433',
      LOCAL_WORKER_URL: 'http://127.0.0.1:8899',
      NOTIFICATION_EMAIL: 'owner@example.com',
      ALLOWED_RECIPIENTS: 'owner@example.com',
      MARKETING_ENABLED: 'false',
    } as unknown as Env,
    database,
  };
}
