// Test the initials matching logic locally
function extractInitials(text) {
    return text
        .split(/\s+/) // Split by whitespace
        .filter(word => word.length > 0) // Remove empty strings
        .map(word => word.charAt(0).toUpperCase()) // Take first character of each word
        .join('');
}

function matchesInitials(query, text) {
    const initials = extractInitials(text);
    const queryUpper = query.toUpperCase();
    console.log(`  Testing: "${text}" -> initials: "${initials}" vs query: "${queryUpper}"`);
    const matches = initials.startsWith(queryUpper);
    console.log(`  Result: ${matches}`);
    return matches;
}

console.log('🧮 Testing initials matching logic locally...');
console.log('=' * 60);

// Test cases
const testCases = [
    { query: 'bcc', text: 'BELLA CAKE CHOCOLATE CREAM' },
    { query: 'bcc', text: 'BELLA CAKE CHOCOLATE' },
    { query: 'bcc', text: 'BOSS CLASSIC COLA' },
    { query: 'bc', text: 'BELLA CAKE' },
    { query: 'bccc', text: 'BELLA CAKE CHOCOLATE CREAM' },
    { query: 'boss', text: 'BOSS CLASSIC COLA' }, // This should NOT match initials
];

for (const testCase of testCases) {
    console.log(`\n🔍 Query: "${testCase.query}" for "${testCase.text}"`);
    const result = matchesInitials(testCase.query, testCase.text);
    console.log(`✅ Expected match for BCC query: ${testCase.query === 'bcc' && testCase.text.includes('BELLA CAKE CHOCOLATE')}`);
}

// Test the pattern detection
console.log('\n🔍 Testing pattern detection...');
const patterns = ['bcc', 'bc', 'bccc', 'boss', '123', 'x', 'ab'];

for (const pattern of patterns) {
    const isPotentialInitials = /^[a-zA-Z]{2,6}$/.test(pattern);
    console.log(`"${pattern}" -> isPotentialInitials: ${isPotentialInitials}`);
}
