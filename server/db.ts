import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const useXata = process.env.USE_XATA === 'true';
const useVercelPostgres = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePostgres>;
let pool: Pool | postgres.Sql;

if (useVercelPostgres) {
  // Use Vercel Postgres (preferred for Vercel deployments)
  const databaseUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!databaseUrl) {
    throw new Error(
      "POSTGRES_URL or POSTGRES_PRISMA_URL must be set for Vercel Postgres connection",
    );
  }
  console.log('Connecting to Vercel Postgres');
  pool = postgres(databaseUrl);
  db = drizzlePostgres(pool as postgres.Sql, { schema });
} else if (useXata || isProduction) {
  // Use Xata/Neon for production or when explicitly requested
  const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_POSTGRES;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL or DATABASE_URL_POSTGRES must be set for Xata connection",
    );
  }
  console.log('Connecting to Xata/Neon database');
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool as Pool, schema });
} else {
  // Use local PostgreSQL for development
  const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:a@localhost:5432/reev_db';
  console.log('Connecting to local database:', localUrl.replace(/password/, '***'));
  pool = postgres(localUrl);
  db = drizzlePostgres(pool as postgres.Sql, { schema });
}

export { db, pool };
