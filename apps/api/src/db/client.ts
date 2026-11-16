import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Math.max(1,Math.min(30,Number(process.env.DB_POOL_MAX??10)||10)),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});
export const db = drizzle(pool, { schema });
export { pool };
