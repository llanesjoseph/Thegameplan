#!/usr/bin/env node

/**
 * Deploy Firestore indexes using Google Cloud Firestore Admin API
 * This bypasses the broken Firebase CLI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getAccessToken() {
  try {
    // Try to get access token from gcloud
    const token = execSync('gcloud auth application-default print-access-token', {
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    return token;
  } catch (error) {
    try {
      // Fallback: try firebase token
      const token = execSync('firebase login:ci --no-localhost', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      const match = token.match(/[0-9]\/\/[A-Za-z0-9_-]+/);
      if (match) {
        return match[0];
      }
    } catch (e) {
      // ignore
    }

    log('Could not get access token automatically.', 'red');
    log('Please run: gcloud auth application-default login', 'yellow');
    log('Or manually get a token and pass it as an argument.', 'yellow');
    return null;
  }
}

function makeApiRequest(method, path, accessToken, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`API request failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function createIndex(projectId, database, index, accessToken) {
  const encodedCollectionGroup = encodeURIComponent(index.collectionGroup);
  const parent = `projects/${projectId}/databases/${database}/collectionGroups/${encodedCollectionGroup}`;
  const path = `/v1/${parent}/indexes`;

  const indexBody = {
    queryScope: index.queryScope,
    fields: index.fields.map(f => ({
      fieldPath: f.fieldPath,
      ...(f.order && { order: f.order }),
      ...(f.arrayConfig && { arrayConfig: f.arrayConfig })
    }))
  };

  try {
    const result = await makeApiRequest('POST', path, accessToken, indexBody);
    return result;
  } catch (error) {
    // Check if error is because index already exists
    if (error.message.includes('ALREADY_EXISTS') || error.message.includes('409')) {
      return { status: 'already_exists' };
    }
    throw error;
  }
}

async function main() {
  log('\n=== Deploy Firestore Indexes via API ===\n', 'cyan');

  const projectId = 'gameplan-787a2';
  const database = '(default)';

  // Step 1: Get access token
  log('🔐 Getting access token...', 'blue');
  const accessToken = getAccessToken();

  if (!accessToken) {
    log('\n❌ Failed to get access token', 'red');
    log('\n💡 Solution: Install and authenticate with gcloud:', 'yellow');
    log('   1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install', 'blue');
    log('   2. Run: gcloud auth application-default login', 'blue');
    log('   3. Run this script again', 'blue');
    log('\n📋 Alternative: Use manual index creation URLs', 'yellow');
    log('   Run: node force-create-indexes.js', 'blue');
    return;
  }

  log('✅ Got access token\n', 'green');

  // Step 2: Read indexes
  log('📖 Reading firestore.indexes.json...', 'blue');
  const indexConfig = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
  log(`   Found ${indexConfig.indexes.length} indexes\n`, 'green');

  // Step 3: Create each index
  log('🚀 Creating indexes via API...\n', 'blue');

  let created = 0;
  let alreadyExists = 0;
  let failed = 0;

  for (let i = 0; i < indexConfig.indexes.length; i++) {
    const index = indexConfig.indexes[i];
    const fieldsDisplay = index.fields
      .map(f => `${f.fieldPath} (${f.order || f.arrayConfig})`)
      .join(', ');

    process.stdout.write(`${i + 1}. ${index.collectionGroup}: [${fieldsDisplay}] ... `);

    try {
      const result = await createIndex(projectId, database, index, accessToken);

      if (result.status === 'already_exists') {
        log('already exists', 'yellow');
        alreadyExists++;
      } else {
        log('created!', 'green');
        created++;
      }
    } catch (error) {
      log('failed!', 'red');
      log(`   Error: ${error.message}`, 'red');
      failed++;
    }
  }

  // Step 4: Summary
  log('\n=== Summary ===', 'cyan');
  log(`Total indexes: ${indexConfig.indexes.length}`, 'blue');
  log(`Created: ${created}`, 'green');
  log(`Already existed: ${alreadyExists}`, 'yellow');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (created > 0) {
    log('\n⏱️  Indexes are now building. This can take 1-5 minutes.', 'cyan');
    log('Check status at: https://console.firebase.google.com/project/' + projectId + '/firestore/indexes', 'blue');
  }

  log('');
}

main().catch(error => {
  log('\n❌ Script failed:', 'red');
  console.error(error);
  process.exit(1);
});
