import { dbSync } from '../server/sync.js';

async function main() {
  try {
    await dbSync.fullSync();
    console.log('Full sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during full sync:', error);
    process.exit(1);
  }
}

main();
