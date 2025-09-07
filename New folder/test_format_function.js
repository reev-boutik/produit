// Simple Node.js test for the formatPrice function
// This simulates how the price formatting should work

function formatPrice(amount, currency = 'FCFA') {
  if (!amount || amount === 0) {
    return currency === 'FCFA' ? '0 FCFA' : currency === 'EUR' ? '0€' : '$0';
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const convertedAmount = numericAmount; // No conversion for FCFA
  
  switch (currency) {
    case 'FCFA':
      // Show decimals only if they exist (not .00)
      const hasDecimals = convertedAmount % 1 !== 0;
      return `${convertedAmount.toLocaleString('fr-FR', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0
      }).replace(/\s/g, ' ')} FCFA`;
      
    default:
      return `${convertedAmount} FCFA`;
  }
}

// Test cases
console.log('🧪 Testing formatPrice function:');
console.log('');

const testCases = [
  { input: '500.00', expected: '500 FCFA (no decimals)' },
  { input: '1000.00', expected: '1000 FCFA (no decimals)' },
  { input: '12000.00', expected: '12000 FCFA (no decimals)' },
  { input: '1.04', expected: '1,04 FCFA (with decimals)' },
  { input: '1.05', expected: '1,05 FCFA (with decimals)' },
  { input: '1500.50', expected: '1500,50 FCFA (with decimals)' },
  { input: 500, expected: '500 FCFA (no decimals)' },
  { input: 1.04, expected: '1,04 FCFA (with decimals)' }
];

testCases.forEach((test, index) => {
  const result = formatPrice(test.input);
  console.log(`${index + 1}. Input: ${test.input} → Output: "${result}"`);
  console.log(`   Expected: ${test.expected}`);
  console.log('');
});
