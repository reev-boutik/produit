import { dbSync } from '../server/sync.js';

async function main() {
  try {
    await dbSync.syncProductsFromXata();
    console.log('Sync from Xata completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing from Xata:', error);
    process.exit(1);
  }
}

main();
