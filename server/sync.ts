import { db } from './db.js';
import { xata } from './xata.js';
import type { Products, DetailCommande } from './xata.js';
import { products, detailCommande } from '../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { config } from 'dotenv';

config();

export class DatabaseSync {
  private isLocalEnv: boolean;

  constructor() {
    this.isLocalEnv = process.env.NODE_ENV !== 'production' && process.env.USE_XATA !== 'true';
  }

  /**
   * Sync products from local to Xata with batch processing
   */
  async syncProductsToXata() {
    if (!this.isLocalEnv) {
      console.log('Skipping sync to Xata - not in local environment');
      return;
    }

    try {
      console.log('Syncing products from local to Xata...');
      
      // Get all products from local database
      const localProducts = await db.select().from(products);
      console.log(`Found ${localProducts.length} products in local database`);

      const batchSize = 10; // Process in smaller batches to avoid timeouts
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < localProducts.length; i += batchSize) {
        const batch = localProducts.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(localProducts.length / batchSize)} (${batch.length} products)`);
        
        for (const product of batch) {
          try {
            const xataProduct: Partial<Products> = {
              codebar: product.codebar,
              designation: product.designation,
              current_price: parseFloat(product.currentPrice),
              stock_quantity: product.stockQuantity,
              category: product.category || undefined,
              created_at: product.createdAt,
              updated_at: product.updatedAt,
            };

            // Just create new products without checking for duplicates to speed up the process
            await xata.db.products.create(xataProduct);
            successCount++;
          } catch (error) {
            console.error(`Error syncing product ${product.codebar}:`, error.message || error);
            errorCount++;
          }
        }
        
        // Small delay between batches to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Products sync to Xata completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error syncing products to Xata:', error);
      throw error;
    }
  }

  /**
   * Sync detail commande from local to Xata
   */
  async syncDetailCommandeToXata() {
    if (!this.isLocalEnv) {
      console.log('Skipping sync to Xata - not in local environment');
      return;
    }

    try {
      console.log('Syncing detail commande from local to Xata...');
      
      // Get all detail commande from local database with product info
      const localDetailCommandes = await db
        .select({
          id: detailCommande.id,
          productId: detailCommande.productId,
          price: detailCommande.price,
          quantity: detailCommande.quantity,
          commandeDate: detailCommande.commandeDate,
          productCodebar: products.codebar
        })
        .from(detailCommande)
        .leftJoin(products, eq(detailCommande.productId, products.id))
        .orderBy(desc(detailCommande.commandeDate));

      console.log(`Found ${localDetailCommandes.length} detail commande records in local database`);

      for (const commande of localDetailCommandes) {
        try {
          // Find corresponding product in Xata by codebar
          const xataProduct = await xata.db.products.filter({
            codebar: commande.productCodebar
          }).getFirst();

          if (!xataProduct) {
            console.warn(`Product with codebar ${commande.productCodebar} not found in Xata`);
            continue;
          }

          // Check if detail commande already exists in Xata (simplified check)
          const existingCommande = await xata.db.detail_commande.filter({
            'product_id.id': xataProduct.id,
            price: parseFloat(commande.price),
            quantity: commande.quantity
          }).getFirst();

          if (!existingCommande) {
            // Create new detail commande
            const xataDetailCommande: Partial<DetailCommande> = {
              product_id: xataProduct.id,
              price: parseFloat(commande.price),
              quantity: commande.quantity,
              commande_date: commande.commandeDate || new Date(),
            };

            await xata.db.detail_commande.create(xataDetailCommande);
          }
        } catch (error) {
          console.error(`Error syncing detail commande ${commande.id}:`, error);
        }
      }

      console.log('Detail commande sync to Xata completed');
    } catch (error) {
      console.error('Error syncing detail commande to Xata:', error);
      throw error;
    }
  }

  /**
   * Sync products from Xata to local
   */
  async syncProductsFromXata() {
    if (this.isLocalEnv) {
      console.log('Skipping sync from Xata - in local environment');
      return;
    }

    try {
      console.log('Syncing products from Xata to local...');
      
      // Get all products from Xata
      const xataProducts = await xata.db.products.getAll();
      console.log(`Found ${xataProducts.length} products in Xata`);

      for (const product of xataProducts) {
        try {
          // Check if product exists in local database
          const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.codebar, product.codebar))
            .limit(1);

          const productData = {
            codebar: product.codebar,
            designation: product.designation,
            currentPrice: product.current_price.toString(),
            stockQuantity: product.stock_quantity,
            category: product.category,
            updatedAt: new Date(),
          };

          if (existingProduct.length > 0) {
            // Update existing product
            await db
              .update(products)
              .set(productData)
              .where(eq(products.codebar, product.codebar));
          } else {
            // Create new product
            await db.insert(products).values(productData);
          }
        } catch (error) {
          console.error(`Error syncing product ${product.codebar}:`, error);
        }
      }

      console.log('Products sync from Xata completed');
    } catch (error) {
      console.error('Error syncing products from Xata:', error);
      throw error;
    }
  }

  /**
   * Full bidirectional sync
   */
  async fullSync() {
    try {
      console.log('Starting full database sync...');
      
      if (this.isLocalEnv) {
        // Local to Xata sync
        await this.syncProductsToXata();
        await this.syncDetailCommandeToXata();
      } else {
        // Xata to local sync
        await this.syncProductsFromXata();
      }
      
      console.log('Full sync completed successfully');
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }
}

export const dbSync = new DatabaseSync();
