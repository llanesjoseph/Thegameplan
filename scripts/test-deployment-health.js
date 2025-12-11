const https = require('https');

console.log('🔍 Testing Deployment Health...\n');

const BASE_URL = 'https://cruciblegameplan.web.app';

async function testPage(url, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'GamePlan-Health-Check/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
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
          url: url,
          contentLength: responseData.length,
          hasContent: responseData.length > 0,
          isHtml: res.headers['content-type']?.includes('text/html')
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        url: url
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: url
      });
    });

    req.end();
  });
}

async function testSecurityHeaders(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'HEAD',
      headers: {
        'User-Agent': 'GamePlan-Security-Check/1.0'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        url: url
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        url: url
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: url
      });
    });

    req.end();
  });
}

async function runHealthChecks() {
  const criticalPages = [
    '/',
    '/contributors',
    '/contributors/apply',
    '/dashboard',
    '/gear',
    '/lessons',
    '/onboarding',
    '/subscribe'
  ];

  console.log('🧪 Testing Critical Pages...\n');

  let passedTests = 0;
  let totalTests = criticalPages.length;

  for (const page of criticalPages) {
    try {
      const result = await testPage(BASE_URL + page);
      
      if (result.status === 200 && result.hasContent && result.isHtml) {
        console.log(`✅ ${page} - Status: ${result.status}, Size: ${result.contentLength} bytes`);
        passedTests++;
      } else {
        console.log(`❌ ${page} - Status: ${result.status}, Content: ${result.hasContent}, HTML: ${result.isHtml}`);
      }
    } catch (error) {
      console.log(`❌ ${page} - Failed: ${error.error || error.message}`);
    }
  }

  console.log('\n🧪 Testing Security Headers...\n');

  try {
    const securityResult = await testSecurityHeaders(BASE_URL);
    const headers = securityResult.headers;
    
    const securityChecks = [
      { name: 'X-Frame-Options', expected: 'DENY', actual: headers['x-frame-options'] },
      { name: 'X-Content-Type-Options', expected: 'nosniff', actual: headers['x-content-type-options'] },
      { name: 'X-XSS-Protection', expected: '1; mode=block', actual: headers['x-xss-protection'] },
      { name: 'Strict-Transport-Security', expected: 'max-age=31536000', actual: headers['strict-transport-security'] },
      { name: 'Content-Security-Policy', expected: 'default-src', actual: headers['content-security-policy'] }
    ];

    let securityPassed = 0;
    for (const check of securityChecks) {
      if (check.actual && check.actual.includes(check.expected)) {
        console.log(`✅ ${check.name} - Present`);
        securityPassed++;
      } else {
        console.log(`❌ ${check.name} - Missing or incorrect`);
      }
    }

    console.log(`\n📊 Security Headers: ${securityPassed}/${securityChecks.length} passed`);
  } catch (error) {
    console.log(`❌ Security header test failed: ${error.error || error.message}`);
  }

  console.log(`\n📊 Page Health: ${passedTests}/${totalTests} pages passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All health checks passed! Deployment is healthy.');
  } else {
    console.log('\n⚠️  Some health checks failed. Review the results above.');
  }

  return {
    pagesPassed: passedTests,
    totalPages: totalTests,
    healthScore: Math.round((passedTests / totalTests) * 100)
  };
}

runHealthChecks().then(results => {
  console.log(`\n🏆 Overall Health Score: ${results.healthScore}%`);
  process.exit(results.healthScore >= 90 ? 0 : 1);
});
