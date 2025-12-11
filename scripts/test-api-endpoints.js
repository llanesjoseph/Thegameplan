const https = require('https');
const http = require('http');

console.log('🔍 Testing API Endpoints...\n');

const API_BASE = 'https://cruciblegameplan.web.app/api';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GamePlan-Test-Suite/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData,
          url: endpoint
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        url: endpoint
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAllEndpoints() {
  const endpoints = [
    { path: '/ai-coaching', method: 'POST', data: { message: 'test message' } },
    { path: '/provision-superadmin', method: 'POST' },
    { path: '/seed-client', method: 'GET' },
    { path: '/seed-database', method: 'GET' },
    { path: '/set-user-role', method: 'POST' }
  ];

  console.log('🧪 Testing API Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
      const result = await testEndpoint(endpoint.path, endpoint.method, endpoint.data);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`✅ ${endpoint.path} - Status: ${result.status}`);
      } else if (result.status === 404) {
        console.log(`⚠️  ${endpoint.path} - Not Found (${result.status})`);
      } else if (result.status === 405) {
        console.log(`⚠️  ${endpoint.path} - Method Not Allowed (${result.status})`);
      } else if (result.status >= 400) {
        console.log(`❌ ${endpoint.path} - Error: ${result.status}`);
      } else {
        console.log(`✅ ${endpoint.path} - Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.path} - Failed: ${error.error || error.message}`);
    }
  }

  console.log('\n🎉 API endpoint testing completed!');
}

testAllEndpoints();
