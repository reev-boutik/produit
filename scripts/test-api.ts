import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_ENDPOINTS = [
  { path: '/api/stats', method: 'GET', description: 'Get statistics' },
  { path: '/api/products', method: 'GET', description: 'Get products' },
  { path: '/api/products?search=test', method: 'GET', description: 'Search products' }
];

async function testEndpoint(endpoint: { path: string; method: string; description: string }) {
  try {
    console.log(`\n🔍 Testing: ${endpoint.description}`);
    console.log(`   ${endpoint.method} ${endpoint.path}`);

    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const statusColor = response.status >= 200 && response.status < 300 ? '✅' : '❌';
    console.log(`   ${statusColor} Status: ${response.status} ${response.statusText}`);

    if (response.status >= 200 && response.status < 300) {
      try {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          console.log(`   📊 Returned ${data.length} items`);
          if (data.length > 0) {
            console.log(`   🔍 Sample item keys: ${Object.keys(data[0]).join(', ')}`);
          }
        } else if (typeof data === 'object' && data !== null) {
          console.log(`   📊 Response keys: ${Object.keys(data).join(', ')}`);
        } else {
          console.log(`   📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } catch (parseError) {
        console.log('   ⚠️  Response is not JSON');
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
    }

    return {
      endpoint: endpoint.path,
      success: response.status >= 200 && response.status < 300,
      status: response.status
    };

  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
    return {
      endpoint: endpoint.path,
      success: false,
      error: error.message
    };
  }
}

async function testProductBarcodeLookup() {
  console.log('\n🔍 Testing Product Barcode Lookup...');
  
  try {
    // First get a sample product to test search with
    const productsResponse = await fetch(`${BASE_URL}/api/products?limit=1`);
    if (!productsResponse.ok) {
      console.log('   ❌ Could not get sample product for lookup test');
      return;
    }

    const productsData = await productsResponse.json();
    if (!productsData.products || !Array.isArray(productsData.products) || productsData.products.length === 0) {
      console.log('   ❌ No products available for lookup test');
      return;
    }

    const sampleCodebar = productsData.products[0].codebar;
    console.log(`   🔍 Looking up barcode: ${sampleCodebar}`);

    const lookupResponse = await fetch(`${BASE_URL}/api/products/barcode/${sampleCodebar}`);
    const statusColor = lookupResponse.status >= 200 && lookupResponse.status < 300 ? '✅' : '❌';
    console.log(`   ${statusColor} Lookup Status: ${lookupResponse.status}`);

    if (lookupResponse.ok) {
      const result = await lookupResponse.json();
      console.log(`   ✅ Found product: ${result.nom} - Article ID: ${result.articleId}`);
    } else {
      const errorText = await lookupResponse.text();
      console.log(`   ❌ Lookup failed: ${errorText}`);
    }

  } catch (error) {
    console.log(`   ❌ Lookup test error: ${error.message}`);
  }
}

async function checkServerRunning() {
  console.log(`🚀 Checking if server is running at ${BASE_URL}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/stats`);
    if (response.ok) {
      console.log('✅ Server is running!');
      return true;
    } else {
      console.log('❌ Server returned error status');
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running or unreachable');
    console.log('   Make sure to start your server with: npm run dev');
    return false;
  }
}

async function runApiTests() {
  console.log('🧪 API Testing Suite');
  console.log('====================');

  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('\n💡 To start the server, run: npm run dev');
    return;
  }

  console.log('\n📡 Testing API Endpoints...');
  
  const results = [];

  // Test all endpoints
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  // Test product barcode lookup functionality
  await testProductBarcodeLookup();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total} endpoints`);
  
  if (successful === total) {
    console.log('\n🎉 All API tests passed! Your server is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }

  console.log('\n💡 Tips:');
  console.log('  • If endpoints fail, check your database connections');
  console.log('  • Make sure PostgreSQL is running and accessible');
  console.log('  • Verify your .env file has correct database credentials');
  
  return results;
}

// Run tests
runApiTests().catch(console.error);

export { runApiTests, testEndpoint, checkServerRunning };
