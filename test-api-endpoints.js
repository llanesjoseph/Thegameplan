const fetch = require('node-fetch');

console.log('🌐 TESTING API ENDPOINTS');
console.log('=' .repeat(40));

const baseUrl = 'https://playbookd.crucibleanalytics.dev';

const endpoints = [
  {
    path: '/api/coach/messages',
    method: 'GET',
    expectedStatus: [200, 401, 400],
    description: 'Get coach messages'
  },
  {
    path: '/api/coach/reply-message',
    method: 'POST',
    expectedStatus: [200, 401, 400, 405],
    description: 'Reply to message'
  },
  {
    path: '/api/athlete/contact-coach',
    method: 'POST',
    expectedStatus: [200, 401, 400, 405],
    description: 'Contact coach'
  },
  {
    path: '/api/athlete/sync-lessons',
    method: 'POST',
    expectedStatus: [200, 401, 400, 405],
    description: 'Sync athlete lessons'
  },
  {
    path: '/api/athlete/progress',
    method: 'POST',
    expectedStatus: [200, 401, 400, 405],
    description: 'Update athlete progress'
  },
  {
    path: '/api/generate-lesson',
    method: 'POST',
    expectedStatus: [200, 401, 400, 405],
    description: 'Generate lesson'
  },
  {
    path: '/api/coach-profile/jasmine-aikey--coach',
    method: 'GET',
    expectedStatus: [200, 404],
    description: 'Get coach profile'
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Testing: ${endpoint.description}`);
    console.log(`   ${endpoint.method} ${endpoint.path}`);
    
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const isExpected = endpoint.expectedStatus.includes(status);
    
    if (isExpected) {
      console.log(`   ✅ Status: ${status} (Expected)`);
    } else {
      console.log(`   ⚠️ Status: ${status} (Unexpected - expected: ${endpoint.expectedStatus.join(', ')})`);
    }
    
    // Try to get response body for debugging
    try {
      const body = await response.text();
      if (body && body.length > 0) {
        console.log(`   📄 Response: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
      }
    } catch (bodyError) {
      console.log(`   📄 Response: Could not read response body`);
    }
    
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: status,
      expected: isExpected,
      description: endpoint.description
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: 'ERROR',
      expected: false,
      description: endpoint.description,
      error: error.message
    };
  }
}

async function testAllEndpoints() {
  console.log(`🚀 Testing ${endpoints.length} API endpoints`);
  console.log(`🌐 Base URL: ${baseUrl}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 TEST SUMMARY:');
  console.log('=' .repeat(40));
  
  const passed = results.filter(r => r.expected).length;
  const failed = results.filter(r => !r.expected).length;
  
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results.filter(r => !r.expected).forEach(result => {
      console.log(`   ${result.method} ${result.endpoint} - Status: ${result.status}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  
  // Check for common issues
  const methodNotAllowed = results.filter(r => r.status === 405);
  if (methodNotAllowed.length > 0) {
    console.log('   🔧 Some endpoints return 405 (Method Not Allowed)');
    console.log('      - Check if endpoints require POST instead of GET');
    console.log('      - Verify authentication is working');
  }
  
  const unauthorized = results.filter(r => r.status === 401);
  if (unauthorized.length > 0) {
    console.log('   🔐 Some endpoints return 401 (Unauthorized)');
    console.log('      - This is expected for protected endpoints');
    console.log('      - Test with proper authentication tokens');
  }
  
  const badRequest = results.filter(r => r.status === 400);
  if (badRequest.length > 0) {
    console.log('   📝 Some endpoints return 400 (Bad Request)');
    console.log('      - Check request parameters and body');
    console.log('      - Verify input validation');
  }
  
  console.log('\n🎯 API ENDPOINT TESTING COMPLETE!');
}

// Run the tests
testAllEndpoints().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
