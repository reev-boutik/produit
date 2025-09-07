interface ExchangeRateResponse {
  provider: string;
  WARNING_UPGRADE_TO_V6: string;
  terms: string;
  base: string;
  date: string;
  time_last_updated: number;
  rates: Record<string, number>;
}

interface CachedRates {
  rates: {
    FCFA: number;
    EUR: number;
    USD: number;
  };
  lastUpdated: number;
  expiresAt: number;
}

// Cache rates for 1 hour (3600000 ms)
const CACHE_DURATION = 3600000;

// Fallback rates if API fails
const FALLBACK_RATES = {
  FCFA: 1,
  EUR: 0.00152,
  USD: 0.00165
};

let cachedRates: CachedRates | null = null;

/**
 * Fetches live exchange rates from ExchangeRate-API
 * Uses XAF (Central African CFA Franc) as base currency
 */
async function fetchLiveRates(): Promise<{ FCFA: number; EUR: number; USD: number }> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/XAF');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ExchangeRateResponse = await response.json();
    
    return {
      FCFA: 1, // Base currency
      EUR: data.rates.EUR || FALLBACK_RATES.EUR,
      USD: data.rates.USD || FALLBACK_RATES.USD
    };
  } catch (error) {
    console.error('Failed to fetch live exchange rates:', error);
    throw error;
  }
}

/**
 * Gets exchange rates with caching
 * Returns cached rates if still valid, otherwise fetches new ones
 */
export async function getExchangeRates(): Promise<{ FCFA: number; EUR: number; USD: number }> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && now < cachedRates.expiresAt) {
    console.log('Using cached exchange rates');
    return cachedRates.rates;
  }
  
  try {
    console.log('Fetching live exchange rates...');
    const rates = await fetchLiveRates();
    
    // Cache the new rates
    cachedRates = {
      rates,
      lastUpdated: now,
      expiresAt: now + CACHE_DURATION
    };
    
    console.log('Exchange rates updated:', rates);
    return rates;
  } catch (error) {
    console.error('Failed to get live rates, using fallback:', error);
    
    // If we have cached rates (even expired), use them
    if (cachedRates) {
      console.log('Using expired cached rates as fallback');
      return cachedRates.rates;
    }
    
    // Last resort: use hardcoded fallback rates
    console.log('Using hardcoded fallback rates');
    return FALLBACK_RATES;
  }
}

/**
 * Gets cached rates info for debugging/monitoring
 */
export function getCacheInfo(): { hasCache: boolean; lastUpdated: number | null; expiresAt: number | null } {
  return {
    hasCache: cachedRates !== null,
    lastUpdated: cachedRates?.lastUpdated || null,
    expiresAt: cachedRates?.expiresAt || null
  };
}
