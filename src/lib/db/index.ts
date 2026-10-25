import "server-only";
import { SCHEMA_SQL } from "./schema";

/**
 * Minimal database layer.
 *
 * Production: PostgreSQL via DATABASE_URL (any managed Postgres: Neon,
 * Supabase, RDS, Railway…). Postgres provides the transactions and locks
 * needed for safe capacity control and idempotent payment processing —
 * something Google Sheets cannot provide.
 *
 * Local development / tests: an embedded Postgres (PGlite) stored in
 * .data/pglite, used automatically when DATABASE_URL is not set and we are
 * not in production (or G33_ALLOW_LOCAL_DB=true).
 */

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Database extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "Database is not configured") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

declare global {
  var __g33db: Promise<Database> | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) || localDbAllowed();
}

function localDbAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.G33_ALLOW_LOCAL_DB === "true";
}

async function createPostgres(url: string): Promise<Database> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url,
    // SSL is controlled by the connection string (e.g. ?sslmode=require).
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  });
  const db: Database = {
    async query<T extends Row>(sql: string, params: unknown[] = []) {
      const res = await pool.query(sql, params);
      return res.rows as T[];
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const tx: Queryable = {
          async query<T extends Row>(sql: string, params: unknown[] = []) {
            const res = await client.query(sql, params);
            return res.rows as T[];
          },
        };
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
  };
  await db.query(SCHEMA_SQL);
  return db;
}

export async function createPglite(dataDir?: string): Promise<Database> {
  // On some machines V8's optimizing WASM compiler runs out of memory compiling
  // PGlite; the baseline compiler (Liftoff) avoids it. Local/dev/test only.
  const v8 = await import("node:v8");
  v8.setFlagsFromString("--liftoff-only");
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = dataDir ? new PGlite(dataDir) : new PGlite();
  await pg.exec(SCHEMA_SQL);
  // PGlite is single-connection: serialize transactions so they never interleave.
  let chain: Promise<unknown> = Promise.resolve();
  const db: Database = {
    async query<T extends Row>(sql: string, params: unknown[] = []) {
      await chain.catch(() => {});
      const res = await pg.query<T>(sql, params);
      return res.rows;
    },
    transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
      const run = chain.catch(() => {}).then(() =>
        pg.transaction(async (t) => {
          const tx: Queryable = {
            async query<R extends Row>(sql: string, params: unknown[] = []) {
              const res = await t.query<R>(sql, params);
              return res.rows;
            },
          };
          return fn(tx);
        }),
      );
      chain = run;
      return run;
    },
  };
  return db;
}

export function getDb(): Promise<Database> {
  if (!globalThis.__g33db) {
    const url = process.env.DATABASE_URL;
    let p: Promise<Database>;
    if (url) p = createPostgres(url);
    else if (localDbAllowed()) p = createPglite(process.env.G33_LOCAL_DB_DIR ?? ".data/pglite");
    else p = Promise.reject(new DatabaseUnavailableError());
    globalThis.__g33db = p;
    // Don't cache failures forever.
    p.catch(() => {
      if (globalThis.__g33db === p) globalThis.__g33db = undefined;
    });
  }
  return globalThis.__g33db;
}

/** Test helper: inject a database instance. */
export function __setDbForTests(db: Database | undefined) {
  globalThis.__g33db = db ? Promise.resolve(db) : undefined;
}
