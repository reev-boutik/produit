import { getExchangeRates } from './exchangeRates';

// Fallback rates if live rates are not available
const FALLBACK_CURRENCY_RATES = {
  FCFA: 1,
  EUR: 0.00152,
  USD: 0.00165
};

export type Currency = 'FCFA' | 'EUR' | 'USD';

let currentRates: { FCFA: number; EUR: number; USD: number } | null = null;
let ratesPromise: Promise<{ FCFA: number; EUR: number; USD: number }> | null = null;

/**
 * Gets current exchange rates (cached or live)
 */
async function getCurrentRates(): Promise<{ FCFA: number; EUR: number; USD: number }> {
  // If we have cached rates, return them
  if (currentRates) {
    return currentRates;
  }

  // If there's already a request in progress, wait for it
  if (ratesPromise) {
    return ratesPromise;
  }

  // Start a new request
  ratesPromise = getExchangeRates().then(rates => {
    currentRates = rates;
    // Clear the promise so future calls can make new requests
    ratesPromise = null;
    return rates;
  }).catch(error => {
    console.warn('Failed to get live rates, using fallback:', error);
    currentRates = FALLBACK_CURRENCY_RATES;
    ratesPromise = null;
    return FALLBACK_CURRENCY_RATES;
  });

  return ratesPromise;
}

/**
 * Formats a number in the specified currency with proper formatting
 * @param amount - The amount in FCFA (base currency)
 * @param currency - The target currency ('FCFA', 'EUR', 'USD')
 * @param rates - Optional rates to use (if not provided, will fetch live rates)
 * @returns Formatted currency string
 */
export function formatPrice(
  amount: string | number | null | undefined, 
  currency: Currency = 'FCFA',
  rates?: { FCFA: number; EUR: number; USD: number }
): string {
  if (!amount || amount === 0) {
    return currency === 'FCFA' ? '0 FCFA' : currency === 'EUR' ? '0€' : '$0';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Use provided rates or fallback rates for synchronous formatting
  const conversionRates = rates || currentRates || FALLBACK_CURRENCY_RATES;
  const convertedAmount = numericAmount * conversionRates[currency];
  
  switch (currency) {
    case 'FCFA':
      // Show decimals only if they exist (not .00)
      const hasDecimals = convertedAmount % 1 !== 0;
      return `${convertedAmount.toLocaleString('fr-FR', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0
      }).replace(/\s/g, ' ')} FCFA`;
      
    case 'EUR':
      return `${convertedAmount.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).replace(/\s/g, ' ')}€`;
      
    case 'USD':
      return `$${convertedAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      
    default:
      return `${convertedAmount}F`;
  }
}

/**
 * Async version of formatPrice that fetches live rates
 * @param amount - The amount in FCFA (base currency)
 * @param currency - The target currency ('FCFA', 'EUR', 'USD')
 * @returns Promise<Formatted currency string>
 */
export async function formatPriceAsync(
  amount: string | number | null | undefined, 
  currency: Currency = 'FCFA'
): Promise<string> {
  const rates = await getCurrentRates();
  return formatPrice(amount, currency, rates);
}

/**
 * Initialize exchange rates on module load
 * This ensures rates are available for synchronous formatPrice calls
 */
getCurrentRates().catch(() => {
  // Silently fail, will use fallback rates
});

/**
 * @deprecated Use formatPrice instead
 * Formats a number as F currency with proper thousand separators (spaces)
 * @param amount - The amount to format (can be string or number)
 * @returns Formatted currency string (e.g., "1 500F")
 */
export function formatFCFA(amount: string | number | null | undefined): string {
  return formatPrice(amount, 'FCFA');
}

/**
 * Formats a number with thousand separators (spaces)
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1 500")
 */
export function formatNumber(amount: string | number | null | undefined): string {
  if (!amount || amount === 0) {
    return '0';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return numericAmount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace(/\s/g, ' ');
}
