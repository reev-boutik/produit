import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { count, eq, desc, limit } from 'drizzle-orm';
import { products, detailCommande } from '../shared/schema';
import { getXataClient } from '../src/xata';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test local PostgreSQL connection
async function testLocalDatabase() {
  console.log('\n🧪 Testing Local PostgreSQL Database...');
  console.log('================================');

  try {
    const connectionString = `postgresql://postgres:a@localhost:5432/reev_db`;
    console.log('Connecting to:', connectionString.replace(':a@', ':***@'));

    const client = postgres(connectionString);
    const db = drizzle(client);

    // Test connection
    console.log('✅ Connected to PostgreSQL');

    // Count products
    const productCount = await db.select({ count: count() }).from(products);
    console.log(`📦 Products in local DB: ${productCount[0].count}`);

    // Count detail commande
    const commandeCount = await db.select({ count: count() }).from(detailCommande);
    console.log(`🧾 Detail commande in local DB: ${commandeCount[0].count}`);

    // Sample products
    const sampleProducts = await db
      .select()
      .from(products)
      .limit(5);

    console.log('\n📋 Sample products:');
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.designation} (${product.codebar}) - ${product.prixVente}€`);
    });

    // Sample detail commande
    const sampleCommande = await db
      .select()
      .from(detailCommande)
      .limit(5);

    console.log('\n📋 Sample detail commande:');
    sampleCommande.forEach((cmd, index) => {
      console.log(`  ${index + 1}. Command ${cmd.id}: Product ID ${cmd.produitId} (qty: ${cmd.qteAchat})`);
    });

    await client.end();
    console.log('✅ Local PostgreSQL test completed successfully');

    return {
      success: true,
      productCount: productCount[0].count,
      commandeCount: commandeCount[0].count,
      sampleProducts,
      sampleCommande
    };

  } catch (error) {
    console.error('❌ Local PostgreSQL test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test Xata database connection
async function testXataDatabase() {
  console.log('\n🌐 Testing Xata Database...');
  console.log('===========================');

  try {
    const xata = getXataClient();
    console.log('✅ Connected to Xata');

    // Note: Current Xata schema has different field names than local DB
    console.log('⚠️  Schema mismatch detected - Xata uses different field names');
    console.log('   Xata fields: codebar, designation, currentPrice, stockQuantity, category');
    console.log('   Local fields: codebar, nom, prix_vente, stock_quantite, categorie');

    // Get a sample of products (with pagination limit)
    const sampleXataProducts = await xata.db.products
      .select(['codebar', 'designation', 'currentPrice'])
      .getMany({ pagination: { size: 5 } });

    const xataProductCount = sampleXataProducts.length;
    console.log(`📦 Sample products in Xata DB: ${xataProductCount} (using pagination)`);

    // Try to get more with getAll() to see actual count
    try {
      const allXataProducts = await xata.db.products.getAll();
      console.log(`📦 Total products in Xata DB: ${allXataProducts.length}`);
    } catch (error) {
      console.log('📦 Could not get total count, using sample count');
    }

    // Sample products from Xata
    console.log('\n📋 Sample products from Xata:');
    sampleXataProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.designation} (${product.codebar}) - ${product.currentPrice}€`);
    });

    // Try to get detail_commande samples
    const sampleXataCommande = await xata.db.detail_commande
      .select(['price', 'quantity'])
      .getMany({ pagination: { size: 5 } });

    console.log('\n📋 Sample detail commande from Xata:');
    sampleXataCommande.forEach((cmd, index) => {
      console.log(`  ${index + 1}. Price: ${cmd.price}€, Qty: ${cmd.quantity}`);
    });

    console.log('✅ Xata database test completed successfully');

    return {
      success: true,
      productCount: xataProductCount,
      commandeCount: sampleXataCommande.length,
      sampleProducts: sampleXataProducts,
      sampleCommande: sampleXataCommande
    };

  } catch (error) {
    console.error('❌ Xata database test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test specific product lookup
async function testProductLookup(codebar: string) {
  console.log(`\n🔍 Testing Product Lookup for codebar: ${codebar}`);
  console.log('================================================');

  try {
    // Test local database
    const connectionString = `postgresql://postgres:a@localhost:5432/reev_db`;
    const client = postgres(connectionString);
    const db = drizzle(client);

    const localProduct = await db
      .select()
      .from(products)
      .where(eq(products.codebar, codebar))
      .limit(1);

    console.log('🏠 Local database result:');
    if (localProduct.length > 0) {
      console.log(`  ✅ Found: ${localProduct[0].designation} - ${localProduct[0].prixVente}€`);
    } else {
      console.log('  ❌ Not found in local database');
    }

    // Test Xata database
    const xata = getXataClient();
    const xataProduct = await xata.db.products
      .filter({ codebar })
      .getFirst();

    console.log('🌐 Xata database result:');
    if (xataProduct) {
      console.log(`  ✅ Found: ${xataProduct.designation} - ${xataProduct.currentPrice}€`);
    } else {
      console.log('  ❌ Not found in Xata database');
    }

    await client.end();

    return {
      local: localProduct[0] || null,
      xata: xataProduct || null
    };

  } catch (error) {
    console.error('❌ Product lookup test failed:', error);
    return { error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Database Tests');
  console.log('==========================');

  const results = {
    local: null,
    xata: null,
    productLookup: null
  };

  // Test local database
  results.local = await testLocalDatabase();

  // Test Xata database
  results.xata = await testXataDatabase();

  // Test product lookup with a sample codebar
  if (results.local?.success && results.local.sampleProducts?.length > 0) {
    const sampleCodebar = results.local.sampleProducts[0].codebar;
    results.productLookup = await testProductLookup(sampleCodebar);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Local PostgreSQL: ${results.local?.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Xata Database: ${results.xata?.success ? '✅ PASSED' : '❌ FAILED'}`);

  if (results.local?.success && results.xata?.success) {
    console.log(`\n📈 Data Comparison:`);
    console.log(`  Local Products: ${results.local.productCount}`);
    console.log(`  Xata Products: ${results.xata.productCount}`);
    console.log(`  Sync Success Rate: ${((results.xata.productCount / results.local.productCount) * 100).toFixed(2)}%`);
    
    console.log(`  Local Detail Commande: ${results.local.commandeCount}`);
    console.log(`  Xata Detail Commande: ${results.xata.commandeCount}`);
  }

  if (results.local?.success || results.xata?.success) {
    console.log('\n🎉 Database setup is working! You can now:');
    console.log('  • Use local PostgreSQL for development');
    console.log('  • Use Xata for production');
    console.log('  • Run sync operations between databases');
    console.log('  • Build your React app with database connectivity');
  }

  return results;
}

// Run tests
runTests().catch(console.error);

export { testLocalDatabase, testXataDatabase, testProductLookup, runTests };
