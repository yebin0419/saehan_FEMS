import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

function getConnectionString() {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL is not set",
    );
  }
  return url;
}

const sql = neon(getConnectionString());

export const db = drizzle(sql, { schema });
export { schema };
