import { db } from '../server/db.js';
import { getXataClient } from '../src/xata.js';
import { products, detailCommande } from '../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { config } from 'dotenv';

config();

const xata = getXataClient();

async function syncProductsToXata() {
  try {
    console.log('Syncing products from local to Xata with exact field mapping...');
    
    // Get all products from local database
    const localProducts = await db.select().from(products);
    console.log(`Found ${localProducts.length} products in local database`);

    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < localProducts.length; i += batchSize) {
      const batch = localProducts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(localProducts.length / batchSize)} (${batch.length} products)`);
      
      for (const product of batch) {
        try {
          // Map exactly to match both local and Xata schemas
          const xataProduct = {
            codebar: product.codebar,
            designation: product.designation,
            prix_vente: product.prixVente ? parseFloat(product.prixVente) : 0,
            stock_actuel: product.stockActuel ? parseFloat(product.stockActuel) : 0,
            category: product.category,
            image_url: product.imageUrl,
            valide: product.valide,
            cree_a: product.creeA,
            cree_par: product.creePar,
            modifie_a: product.modifieA,
            modifie_par: product.modifiePar,
          };

          await xata.db.products.create(xataProduct);
          successCount++;
        } catch (error) {
          console.error(`Error syncing product ${product.id} (${product.codebar}):`, error.message || error);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Products sync to Xata completed. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error syncing products to Xata:', error);
    throw error;
  }
}

async function syncDetailCommandeToXata() {
  try {
    console.log('Syncing detail commande from local to Xata with exact field mapping...');
    
    // Get all detail commande from local database
    const localDetailCommandes = await db.select().from(detailCommande);
    console.log(`Found ${localDetailCommandes.length} detail commande records in local database`);

    const batchSize = 20;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < localDetailCommandes.length; i += batchSize) {
      const batch = localDetailCommandes.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(localDetailCommandes.length / batchSize)} (${batch.length} records)`);
      
      for (const commande of batch) {
        try {
          // Map exactly to match both schemas
          const xataDetailCommande = {
            produit_id: commande.produitId,
            prix_achat: commande.prixAchat ? parseFloat(commande.prixAchat) : 0,
            qte_achat: commande.qteAchat ? parseFloat(commande.qteAchat) : 0,
            date_commande: commande.dateCommande,
          };

          await xata.db.detail_commande.create(xataDetailCommande);
          successCount++;
        } catch (error) {
          console.error(`Error syncing detail commande ${commande.id}:`, error.message || error);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`Detail commande sync to Xata completed. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error syncing detail commande to Xata:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting sync to Xata with exact field mapping...');
    
    await syncProductsToXata();
    await syncDetailCommandeToXata();
    
    console.log('Sync to Xata completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  }
}

main();
