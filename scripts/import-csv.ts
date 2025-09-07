import fs from 'fs';
import csv from 'csv-parser';
import { config } from 'dotenv';
import { db } from '../server/db.js';
import { products, detailCommande } from '../shared/schema.js';
import path from 'path';

// Load environment variables
config();

interface ProductCSVRow {
  id: string;
  codebar: string;
  designation: string;
  prix_vente: string;
  stock_actuel: string;
  category: string;
  image_url: string;
  Valide: string;
  cree_a: string;
  cree_par: string;
  modifie_a: string;
  modifie_par: string;
}

interface DetailCommandeCSVRow {
  id: string;
  produit_id: string;
  prix_achat: string;
  qte_achat: string;
  date_commande: string;
}

async function importProducts() {
  console.log('Importing products...');
  const productsPath = 'D:\\dev\\products.csv';
  console.log('Products CSV path:', productsPath);
  const results: ProductCSVRow[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(productsPath)
      .pipe(csv())
      .on('data', (data: ProductCSVRow) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`Found ${results.length} products to import`);
          
          for (const row of results) {
            // Map CSV columns to database schema
            const productData = {
              codebar: row.codebar,
              designation: row.designation,
              currentPrice: parseFloat(row.prix_vente) || 0,
              stockQuantity: parseInt(parseFloat(row.stock_actuel).toString()) || 0,
              category: row.category || null,
            };

            try {
              await db.insert(products).values(productData);
            } catch (error) {
              console.error(`Error inserting product ${row.codebar}:`, error);
            }
          }
          
          console.log('Products imported successfully');
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importDetailCommande() {
  console.log('Importing detail commande...');
  const detailCommandePath = 'D:\\dev\\detail_commande.csv';
  console.log('Detail commande CSV path:', detailCommandePath);
  const results: DetailCommandeCSVRow[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(detailCommandePath)
      .pipe(csv())
      .on('data', (data: DetailCommandeCSVRow) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`Found ${results.length} detail commande records to import`);
          
          // First get all products to map produit_id to actual product IDs
          const allProducts = await db.select().from(products);
          console.log(`Found ${allProducts.length} products in database`);
          
          for (const row of results) {
            // Find the product by index (assuming produit_id is the row index in products.csv)
            const productIndex = parseInt(row.produit_id) - 1;
            if (productIndex >= 0 && productIndex < allProducts.length) {
              const product = allProducts[productIndex];
              
              const commandeData = {
                productId: product.id,
                price: parseFloat(row.prix_achat) || 0,
                quantity: parseInt(parseFloat(row.qte_achat).toString()) || 0,
                commandeDate: new Date(row.date_commande),
              };

              try {
                await db.insert(detailCommande).values(commandeData);
              } catch (error) {
                console.error(`Error inserting detail commande for product ${product.codebar}:`, error);
              }
            } else {
              console.warn(`Could not find product with index ${row.produit_id}`);
            }
          }
          
          console.log('Detail commande imported successfully');
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    console.log('Starting CSV import...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Using Xata:', process.env.USE_XATA === 'true' || process.env.NODE_ENV === 'production');
    
    await importProducts();
    await importDetailCommande();
    
    console.log('CSV import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during CSV import:', error);
    process.exit(1);
  }
}

// Always run main when script is executed directly
main();

export { importProducts, importDetailCommande };
