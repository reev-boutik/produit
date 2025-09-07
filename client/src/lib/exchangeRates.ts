interface ExchangeRatesResponse {
  rates: {
    FCFA: number;
    EUR: number;
    USD: number;
  };
  cache: {
    lastUpdated: string | null;
    expiresAt: string | null;
  };
}

let cachedRates: { rates: { FCFA: number; EUR: number; USD: number }; expiresAt: number } | null = null;

// Fallback rates if API fails
const FALLBACK_RATES = {
  FCFA: 1,
  EUR: 0.00152,
  USD: 0.00165
};

/**
 * Fetches live exchange rates from the API
 */
async function fetchExchangeRates(): Promise<{ FCFA: number; EUR: number; USD: number }> {
  try {
    const response = await fetch('/api/exchange-rates');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ExchangeRatesResponse = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw error;
  }
}

/**
 * Gets exchange rates with client-side caching (5 minutes)
 * Returns cached rates if still valid, otherwise fetches new ones
 */
export async function getExchangeRates(): Promise<{ FCFA: number; EUR: number; USD: number }> {
  const now = Date.now();
  
  // Return cached rates if still valid (5 minutes cache)
  if (cachedRates && now < cachedRates.expiresAt) {
    return cachedRates.rates;
  }
  
  try {
    const rates = await fetchExchangeRates();
    
    // Cache the new rates for 5 minutes
    cachedRates = {
      rates,
      expiresAt: now + (5 * 60 * 1000) // 5 minutes
    };
    
    return rates;
  } catch (error) {
    console.warn('Failed to get live rates, using fallback:', error);
    
    // If we have cached rates (even expired), use them
    if (cachedRates) {
      return cachedRates.rates;
    }
    
    // Last resort: use hardcoded fallback rates
    return FALLBACK_RATES;
  }
}
