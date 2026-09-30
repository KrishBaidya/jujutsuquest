import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.local from the main checkout.");

/** Tagged-template SQL over the pooled connection: sql`select ...`. */
export const sql = neon(url);

/** Drizzle over the same HTTP driver. `db.batch([...])` runs statements in one transaction. */
export const db = drizzle(sql, { schema });

export { schema };
