import { XataClient, getXataClient } from '../src/xata.js';
import { config } from 'dotenv';

config();

// Initialize Xata client with API key
const xata = new XataClient({
  apiKey: process.env.XATA_API_KEY,
});

export { xata };
export type { Products, DetailCommande, ProductScans } from '../src/xata.js';
