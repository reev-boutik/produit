import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const useXata = process.env.USE_XATA === 'true' || isProduction;

let databaseUrl: string;

if (useXata) {
  // Use Xata/Neon for production or when explicitly requested
  databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_POSTGRES || '';
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or DATABASE_URL_POSTGRES must be set for Xata connection");
  }
} else {
  // Use local PostgreSQL for development
  databaseUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/reev_db';
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
