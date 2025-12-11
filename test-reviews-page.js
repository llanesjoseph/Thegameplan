// Test script to check if the reviews page is accessible
const https = require('https');

function testPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 1000) // First 1000 chars
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testReviewsPage() {
  try {
    console.log('🔍 Testing reviews page accessibility...');
    
    // Test 1: Check if the page loads without authentication
    const result = await testPage('https://playbookd.crucibleanalytics.dev/dashboard/athlete/reviews');
    console.log(`📊 Status Code: ${result.statusCode}`);
    console.log(`📊 Content-Type: ${result.headers['content-type']}`);
    console.log(`📊 Body Preview: ${result.body.substring(0, 200)}...`);
    
    if (result.statusCode === 200) {
      console.log('✅ Page loads successfully');
    } else {
      console.log(`⚠️  Page returned status ${result.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing page:', error.message);
  }
}

testReviewsPage().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
