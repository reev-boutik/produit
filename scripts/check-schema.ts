import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseSchema() {
  const connectionString = `postgresql://postgres:a@localhost:5432/reev_db`;
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Checking actual database schema...\n');

    // Get table structure for products
    const productsColumns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `;

    console.log('📦 PRODUCTS table columns:');
    productsColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Get table structure for detail_commande
    const commandeColumns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'detail_commande'
      ORDER BY ordinal_position;
    `;

    console.log('\n🧾 DETAIL_COMMANDE table columns:');
    commandeColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Sample data from products
    const sampleProducts = await client`
      SELECT * FROM products LIMIT 3;
    `;

    console.log('\n📋 Sample products data:');
    sampleProducts.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, Object.keys(product).reduce((obj, key) => {
        obj[key] = product[key];
        return obj;
      }, {} as any));
    });

    await client.end();

  } catch (error) {
    console.error('Error checking schema:', error);
    await client.end();
  }
}

checkDatabaseSchema();
