import fs from 'fs';
import csv from 'csv-parser';
import { config } from 'dotenv';
import { db } from '../server/db.js';
import { products, detailCommande } from '../shared/schema.js';

// Load environment variables
config();

interface ProductCSVRow {
  id: string;
  article_id: string;
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
  console.log('Importing products with exact CSV structure...');
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
            // Parse dates
            const creeA = row.cree_a ? new Date(row.cree_a) : null;
            const modifieA = row.modifie_a ? new Date(row.modifie_a) : null;
            
            // Map CSV columns to database schema exactly
            const productData = {
              id: parseInt(row.id),
              articleId: row.article_id || null,
              codebar: row.codebar || null,
              designation: row.designation || null,
              prixVente: row.prix_vente ? parseFloat(row.prix_vente).toString() : null,
              stockActuel: row.stock_actuel ? parseFloat(row.stock_actuel).toString() : null,
              category: row.category || null,
              imageUrl: row.image_url || null,
              valide: row.Valide === '1' || row.Valide === 'true',
              creeA: creeA,
              creePar: row.cree_par ? parseInt(row.cree_par) : null,
              modifieA: modifieA,
              modifiePar: row.modifie_par ? parseInt(row.modifie_par) : null,
            };

            try {
              await db.insert(products).values(productData);
            } catch (error) {
              console.error(`Error inserting product ${row.id} (${row.codebar}):`, error);
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
  console.log('Importing detail commande with exact CSV structure...');
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
          
          for (const row of results) {
            // Parse date
            const dateCommande = row.date_commande ? new Date(row.date_commande) : null;
            
            const commandeData = {
              id: parseInt(row.id),
              produitId: parseInt(row.produit_id),
              prixAchat: row.prix_achat ? parseFloat(row.prix_achat).toString() : '0',
              qteAchat: row.qte_achat ? parseFloat(row.qte_achat).toString() : '0',
              dateCommande: dateCommande,
            };

            try {
              await db.insert(detailCommande).values(commandeData);
            } catch (error) {
              console.error(`Error inserting detail commande ${row.id} for product ${row.produit_id}:`, error);
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
    console.log('Starting exact CSV import...');
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

// Run main when script is executed directly
main();

export { importProducts, importDetailCommande };
