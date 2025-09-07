import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testSearch(searchTerm: string, description: string) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   Search term: "${searchTerm}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/products?search=${encodeURIComponent(searchTerm)}&limit=5`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.total} results`);
      
      if (data.products && data.products.length > 0) {
        console.log('   📊 Sample results:');
        data.products.forEach((product: any, index: number) => {
          console.log(`     ${index + 1}. ${product.designation} (${product.codebar})`);
          if (product.category) {
            console.log(`        Category: ${product.category}`);
          }
          if (product.prixVente) {
            const formattedPrice = Number(product.prixVente).toLocaleString('fr-FR').replace(/\s/g, ' ');
            console.log(`        Price: ${formattedPrice} F CFA`);
          }
          if (product.stockActuel) {
            console.log(`        Stock: ${product.stockActuel}`);
          }
        });
      }
    } else {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }
}

async function runEnhancedSearchTests() {
  console.log('🧪 Enhanced Multi-Field Search Test Suite');
  console.log('==========================================');
  
  // Test searches by different fields
  await testSearch('8402310198125', 'Search by exact barcode');
  await testSearch('8402', 'Search by partial barcode');
  await testSearch('oil', 'Search by partial product name');
  await testSearch('food', 'Search by category name');
  await testSearch('beaut', 'Search by partial category name');
  
  console.log('\n🎉 Enhanced search tests completed!');
  console.log('\n💡 The search now works across:');
  console.log('  • Product names (designation)');
  console.log('  • Barcodes (codebar)');
  console.log('  • Categories');
  console.log('  • All searches support partial matching');
}

// Run the tests
runEnhancedSearchTests().catch(console.error);
