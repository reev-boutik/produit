import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  const connectionString = `postgresql://postgres:a@localhost:5432/reev_db`;
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🗑️  Dropping existing tables...');
    
    // Drop tables in correct order (child tables first)
    await db.execute(sql`DROP TABLE IF EXISTS product_scans CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS detail_commande CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS products CASCADE;`);
    
    console.log('✅ Tables dropped successfully');
    
    // Drop and recreate the drizzle migrations table
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE;`);
    console.log('✅ Migration table reset');
    
    await client.end();
    console.log('🎉 Database reset completed successfully');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    await client.end();
    process.exit(1);
  }
}

resetDatabase();
