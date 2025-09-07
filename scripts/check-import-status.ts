import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { count } from 'drizzle-orm';
import { products, detailCommande } from '../shared/schema.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkImportStatus() {
  const connectionString = `postgresql://postgres:a@localhost:5432/reev_db`;
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('📊 Checking import status...\n');

    // Count products
    const productCount = await db.select({ count: count() }).from(products);
    console.log(`📦 Products imported: ${productCount[0].count}`);

    // Count detail commande
    const commandeCount = await db.select({ count: count() }).from(detailCommande);
    console.log(`🧾 Detail commande imported: ${commandeCount[0].count}`);

    // Sample products
    const sampleProducts = await db
      .select()
      .from(products)
      .limit(3);

    console.log('\n📋 Sample products:');
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ID: ${product.id}, Codebar: ${product.codebar}, Name: ${product.designation}`);
      console.log(`      Article ID: ${product.articleId}, Price: ${product.prixVente}, Stock: ${product.stockActuel}`);
    });

    // Sample detail commande
    const sampleCommande = await db
      .select()
      .from(detailCommande)
      .limit(3);

    console.log('\n📋 Sample detail commande:');
    sampleCommande.forEach((cmd, index) => {
      console.log(`  ${index + 1}. ID: ${cmd.id}, Product ID: ${cmd.produitId}, Price: ${cmd.prixAchat}, Qty: ${cmd.qteAchat}`);
    });

    await client.end();
    console.log('\n✅ Import status check completed');

  } catch (error) {
    console.error('❌ Error checking import status:', error);
    await client.end();
  }
}

checkImportStatus();
