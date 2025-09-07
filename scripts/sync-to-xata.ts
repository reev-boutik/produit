import { dbSync } from '../server/sync.js';

async function main() {
  try {
    await dbSync.syncProductsToXata();
    await dbSync.syncDetailCommandeToXata();
    console.log('Sync to Xata completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing to Xata:', error);
    process.exit(1);
  }
}

main();
